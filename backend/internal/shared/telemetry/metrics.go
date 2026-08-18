package telemetry

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

type MetricsCollector interface {
	RecordHTTPRequest(method, path string, status int, duration time.Duration)
	RecordDatabaseQuery(operation string, duration time.Duration, err error)
	RecordRedisOperation(operation string, duration time.Duration, hit bool, err error)
	RecordCacheHit()
	RecordCacheMiss()
	GetPrometheusMetrics() string
}

type prometheusCollector struct {
	mu sync.RWMutex

	// HTTP API Metrics
	requestCount uint64
	errorCount   uint64
	latencySumMs uint64

	// Database Metrics
	dbQueryCount   uint64
	dbErrorCount   uint64
	dbLatencySumMs uint64

	// Redis Cache Metrics
	redisOpsCount     uint64
	redisErrorCount   uint64
	redisLatencySumMs uint64
	cacheHits         uint64
	cacheMisses       uint64
}

var globalMetrics = &prometheusCollector{}

func GetGlobalCollector() MetricsCollector {
	return globalMetrics
}

// collectorCounters is an atomic read of every counter, so a snapshot cannot
// mix values from before and after a concurrent update in a way that makes a
// derived average nonsensical.
type collectorCounters struct {
	requests          uint64
	errors            uint64
	latencySumMs      uint64
	dbQueries         uint64
	dbErrors          uint64
	dbLatencySumMs    uint64
	redisOps          uint64
	redisErrors       uint64
	redisLatencySumMs uint64
	cacheHits         uint64
	cacheMisses       uint64
}

// counters reads every counter for the performance snapshot.
func (c *prometheusCollector) counters() collectorCounters {
	return collectorCounters{
		requests:          atomic.LoadUint64(&c.requestCount),
		errors:            atomic.LoadUint64(&c.errorCount),
		latencySumMs:      atomic.LoadUint64(&c.latencySumMs),
		dbQueries:         atomic.LoadUint64(&c.dbQueryCount),
		dbErrors:          atomic.LoadUint64(&c.dbErrorCount),
		dbLatencySumMs:    atomic.LoadUint64(&c.dbLatencySumMs),
		redisOps:          atomic.LoadUint64(&c.redisOpsCount),
		redisErrors:       atomic.LoadUint64(&c.redisErrorCount),
		redisLatencySumMs: atomic.LoadUint64(&c.redisLatencySumMs),
		cacheHits:         atomic.LoadUint64(&c.cacheHits),
		cacheMisses:       atomic.LoadUint64(&c.cacheMisses),
	}
}

func (c *prometheusCollector) RecordHTTPRequest(method, path string, status int, duration time.Duration) {
	atomic.AddUint64(&c.requestCount, 1)
	if status >= 400 {
		atomic.AddUint64(&c.errorCount, 1)
	}
	atomic.AddUint64(&c.latencySumMs, uint64(duration.Milliseconds()))
	// Feed the reservoir as well as the sum: the sum gives an average, but only
	// retained samples can yield percentiles.
	httpLatency.observe(duration)
}

func (c *prometheusCollector) RecordDatabaseQuery(operation string, duration time.Duration, err error) {
	atomic.AddUint64(&c.dbQueryCount, 1)
	if err != nil {
		atomic.AddUint64(&c.dbErrorCount, 1)
	}
	atomic.AddUint64(&c.dbLatencySumMs, uint64(duration.Milliseconds()))
	dbLatency.observe(duration)
}

func (c *prometheusCollector) RecordRedisOperation(operation string, duration time.Duration, hit bool, err error) {
	atomic.AddUint64(&c.redisOpsCount, 1)
	if err != nil {
		atomic.AddUint64(&c.redisErrorCount, 1)
	}
	if hit {
		atomic.AddUint64(&c.cacheHits, 1)
	} else if operation == "GET" {
		atomic.AddUint64(&c.cacheMisses, 1)
	}
	atomic.AddUint64(&c.redisLatencySumMs, uint64(duration.Milliseconds()))
	cacheLatency.observe(duration)
}

func (c *prometheusCollector) RecordCacheHit() {
	atomic.AddUint64(&c.cacheHits, 1)
}

func (c *prometheusCollector) RecordCacheMiss() {
	atomic.AddUint64(&c.cacheMisses, 1)
}

func (c *prometheusCollector) GetPrometheusMetrics() string {
	reqs := atomic.LoadUint64(&c.requestCount)
	errs := atomic.LoadUint64(&c.errorCount)
	sumMs := atomic.LoadUint64(&c.latencySumMs)

	dbReqs := atomic.LoadUint64(&c.dbQueryCount)
	dbErrs := atomic.LoadUint64(&c.dbErrorCount)
	dbSumMs := atomic.LoadUint64(&c.dbLatencySumMs)

	redisOps := atomic.LoadUint64(&c.redisOpsCount)
	redisErrs := atomic.LoadUint64(&c.redisErrorCount)
	redisSumMs := atomic.LoadUint64(&c.redisLatencySumMs)

	hits := atomic.LoadUint64(&c.cacheHits)
	misses := atomic.LoadUint64(&c.cacheMisses)

	avgLatency := float64(0)
	if reqs > 0 {
		avgLatency = float64(sumMs) / float64(reqs)
	}

	avgDbLatency := float64(0)
	if dbReqs > 0 {
		avgDbLatency = float64(dbSumMs) / float64(dbReqs)
	}

	avgRedisLatency := float64(0)
	if redisOps > 0 {
		avgRedisLatency = float64(redisSumMs) / float64(redisOps)
	}

	hitRatio := float64(0)
	totalCacheOps := hits + misses
	if totalCacheOps > 0 {
		hitRatio = float64(hits) / float64(totalCacheOps) * 100.0
	}
	// The exposition reports the same recent-window percentiles the admin
	// performance dashboard shows, so an alert rule and the dashboard cannot
	// disagree about whether latency has regressed.
	quantiles, samples := httpLatency.quantiles(0.50, 0.95, 0.99)
	p50, p95, p99 := quantiles[0], quantiles[1], quantiles[2]
	uptime := time.Since(processStart).Seconds()

	return fmt.Sprintf(`# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total %d

# HELP http_requests_errors_total Total number of HTTP 4xx/5xx errors
# TYPE http_requests_errors_total counter
http_requests_errors_total %d

# HELP http_request_duration_milliseconds_avg Average HTTP request latency
# TYPE http_request_duration_milliseconds_avg gauge
http_request_duration_milliseconds_avg %.2f

# HELP kirmya_db_queries_total Total PostgreSQL database queries
# TYPE kirmya_db_queries_total counter
kirmya_db_queries_total %d

# HELP kirmya_db_query_errors_total Total PostgreSQL query errors
# TYPE kirmya_db_query_errors_total counter
kirmya_db_query_errors_total %d

# HELP kirmya_db_query_duration_milliseconds_avg Average PostgreSQL query latency
# TYPE kirmya_db_query_duration_milliseconds_avg gauge
kirmya_db_query_duration_milliseconds_avg %.2f

# HELP kirmya_redis_ops_total Total Redis cache operations
# TYPE kirmya_redis_ops_total counter
kirmya_redis_ops_total %d

# HELP kirmya_redis_errors_total Total Redis operation errors
# TYPE kirmya_redis_errors_total counter
kirmya_redis_errors_total %d

# HELP kirmya_redis_duration_milliseconds_avg Average Redis operation latency
# TYPE kirmya_redis_duration_milliseconds_avg gauge
kirmya_redis_duration_milliseconds_avg %.2f

# HELP kirmya_cache_hits_total Total number of cache hits
# TYPE kirmya_cache_hits_total counter
kirmya_cache_hits_total %d

# HELP kirmya_cache_misses_total Total number of cache misses
# TYPE kirmya_cache_misses_total counter
kirmya_cache_misses_total %d

# HELP kirmya_cache_hit_ratio Cache hit ratio percentage
# TYPE kirmya_cache_hit_ratio gauge
kirmya_cache_hit_ratio %.2f

# HELP kirmya_http_request_duration_milliseconds Recent HTTP latency percentiles
# TYPE kirmya_http_request_duration_milliseconds gauge
kirmya_http_request_duration_milliseconds{quantile="0.5"} %.2f
kirmya_http_request_duration_milliseconds{quantile="0.95"} %.2f
kirmya_http_request_duration_milliseconds{quantile="0.99"} %.2f

# HELP kirmya_http_latency_samples Observations backing the latency percentiles
# TYPE kirmya_http_latency_samples gauge
kirmya_http_latency_samples %d

# HELP kirmya_uptime_seconds Process uptime
# TYPE kirmya_uptime_seconds gauge
kirmya_uptime_seconds %.2f
`, reqs, errs, avgLatency, dbReqs, dbErrs, avgDbLatency, redisOps, redisErrs, avgRedisLatency, hits, misses, hitRatio,
		p50, p95, p99, samples, uptime)
}
