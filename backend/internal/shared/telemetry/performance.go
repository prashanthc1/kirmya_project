package telemetry

import (
	"sort"
	"sync"
	"time"
)

// latencyReservoirSize is how many recent observations a reservoir keeps.
//
// Percentiles need the distribution, not just a sum, so samples have to be
// retained. A fixed-size ring bounds the memory at roughly 32 KB per reservoir
// and makes the percentiles describe recent behaviour rather than the whole
// process lifetime — which is what an operator looking at a latency dashboard
// wants, since an incident an hour ago should not still be dominating p99.
const latencyReservoirSize = 4096

// latencyReservoir is a fixed-size ring of recent latency observations in
// milliseconds.
type latencyReservoir struct {
	mu      sync.RWMutex
	samples []float64
	// next is the write cursor; it wraps, overwriting the oldest sample.
	next int
	// filled is the number of valid samples, capped at len(samples).
	filled int
}

func newLatencyReservoir() *latencyReservoir {
	return &latencyReservoir{samples: make([]float64, latencyReservoirSize)}
}

// observe records one latency in milliseconds.
func (r *latencyReservoir) observe(d time.Duration) {
	// Sub-millisecond work is common and truncating it to an integer would make
	// every fast request read as zero, so the value is kept fractional.
	value := float64(d.Nanoseconds()) / float64(time.Millisecond)

	r.mu.Lock()
	r.samples[r.next] = value
	r.next = (r.next + 1) % len(r.samples)
	if r.filled < len(r.samples) {
		r.filled++
	}
	r.mu.Unlock()
}

// quantiles returns the requested quantiles and the sample count.
//
// Sorting a copy keeps the read off the write path: observing must stay cheap
// because it happens on every request, while this runs only when a dashboard
// asks.
func (r *latencyReservoir) quantiles(qs ...float64) ([]float64, int) {
	r.mu.RLock()
	count := r.filled
	if count == 0 {
		r.mu.RUnlock()
		return make([]float64, len(qs)), 0
	}
	snapshot := make([]float64, count)
	copy(snapshot, r.samples[:count])
	r.mu.RUnlock()

	sort.Float64s(snapshot)

	results := make([]float64, len(qs))
	for i, q := range qs {
		results[i] = quantileOf(snapshot, q)
	}
	return results, count
}

// quantileOf reads a quantile from sorted samples using nearest-rank.
func quantileOf(sorted []float64, q float64) float64 {
	if len(sorted) == 0 {
		return 0
	}
	if q <= 0 {
		return sorted[0]
	}
	if q >= 1 {
		return sorted[len(sorted)-1]
	}
	// Nearest-rank: the smallest sample at or above the q-th position.
	index := int(q*float64(len(sorted)-1) + 0.5)
	if index < 0 {
		index = 0
	}
	if index >= len(sorted) {
		index = len(sorted) - 1
	}
	return sorted[index]
}

// PerformanceSnapshot is a point-in-time view of process performance.
//
// It is deliberately separate from user analytics: these are runtime facts about
// the server, carry no user data, and are only ever shown to administrators.
type PerformanceSnapshot struct {
	RequestCount uint64
	ErrorCount   uint64
	// RequestRateRPS is requests per second averaged over process uptime.
	RequestRateRPS float64
	AvgLatencyMs   float64
	P50LatencyMs   float64
	P95LatencyMs   float64
	P99LatencyMs   float64
	// SampleWindow is how many observations the percentiles came from. A small
	// window means the percentiles are not yet meaningful, and reporting it stops
	// a p99 taken from three requests being read as a stable figure.
	SampleWindow int

	DBQueryCount   uint64
	DBErrorCount   uint64
	DBAvgLatencyMs float64
	DBP95LatencyMs float64

	CacheOpsCount     uint64
	CacheAvgLatencyMs float64
	CacheHits         uint64
	CacheMisses       uint64

	SearchAvgLatencyMs float64
	SearchP95LatencyMs float64
	SearchCount        uint64

	UptimeSeconds float64
}

// processStart anchors the uptime and the request-rate denominator.
var processStart = time.Now()

// searchLatency and searchCount track search-engine calls, which are recorded
// through RecordSearchQuery rather than being inferred from database latency:
// search may be served by OpenSearch, and folding it into the database numbers
// would misattribute the cost.
var (
	httpLatency   = newLatencyReservoir()
	dbLatency     = newLatencyReservoir()
	cacheLatency  = newLatencyReservoir()
	searchLatency = newLatencyReservoir()
	searchCount   uint64
	searchMu      sync.Mutex
)

// RecordSearchQuery records the latency of one search-engine query.
func RecordSearchQuery(duration time.Duration) {
	searchLatency.observe(duration)
	searchMu.Lock()
	searchCount++
	searchMu.Unlock()
}

// GetPerformanceSnapshot builds the current performance view.
//
// It reads the same counters the Prometheus endpoint exposes, so the admin
// dashboard and the scraper never disagree.
func GetPerformanceSnapshot() PerformanceSnapshot {
	counters := globalMetrics.counters()

	uptime := time.Since(processStart).Seconds()
	if uptime <= 0 {
		uptime = 1
	}

	httpQ, httpSamples := httpLatency.quantiles(0.50, 0.95, 0.99)
	dbQ, _ := dbLatency.quantiles(0.95)

	searchMu.Lock()
	searches := searchCount
	searchMu.Unlock()
	searchQ, _ := searchLatency.quantiles(0.95)

	snapshot := PerformanceSnapshot{
		RequestCount:   counters.requests,
		ErrorCount:     counters.errors,
		RequestRateRPS: round2(float64(counters.requests) / uptime),
		P50LatencyMs:   round2(httpQ[0]),
		P95LatencyMs:   round2(httpQ[1]),
		P99LatencyMs:   round2(httpQ[2]),
		SampleWindow:   httpSamples,

		DBQueryCount:   counters.dbQueries,
		DBErrorCount:   counters.dbErrors,
		DBP95LatencyMs: round2(dbQ[0]),

		CacheOpsCount: counters.redisOps,
		CacheHits:     counters.cacheHits,
		CacheMisses:   counters.cacheMisses,

		SearchCount:        searches,
		SearchP95LatencyMs: round2(searchQ[0]),

		UptimeSeconds: round2(uptime),
	}

	if counters.requests > 0 {
		snapshot.AvgLatencyMs = round2(float64(counters.latencySumMs) / float64(counters.requests))
	}
	if counters.dbQueries > 0 {
		snapshot.DBAvgLatencyMs = round2(float64(counters.dbLatencySumMs) / float64(counters.dbQueries))
	}
	if counters.redisOps > 0 {
		snapshot.CacheAvgLatencyMs = round2(float64(counters.redisLatencySumMs) / float64(counters.redisOps))
	}
	if searches > 0 {
		searchAvg, _ := searchLatency.quantiles(0.50)
		snapshot.SearchAvgLatencyMs = round2(searchAvg[0])
	}

	return snapshot
}

func round2(value float64) float64 {
	return float64(int64(value*100+0.5)) / 100
}
