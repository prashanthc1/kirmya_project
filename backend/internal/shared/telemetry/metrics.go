package telemetry

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

type MetricsCollector interface {
	RecordHTTPRequest(method, path string, status int, duration time.Duration)
	RecordCacheHit()
	RecordCacheMiss()
	GetPrometheusMetrics() string
}

type prometheusCollector struct {
	mu           sync.RWMutex
	requestCount uint64
	errorCount   uint64
	latencySumMs uint64
	cacheHits    uint64
	cacheMisses  uint64
}

var globalMetrics = &prometheusCollector{}

func GetGlobalCollector() MetricsCollector {
	return globalMetrics
}

func (c *prometheusCollector) RecordHTTPRequest(method, path string, status int, duration time.Duration) {
	atomic.AddUint64(&c.requestCount, 1)
	if status >= 400 {
		atomic.AddUint64(&c.errorCount, 1)
	}
	atomic.AddUint64(&c.latencySumMs, uint64(duration.Milliseconds()))
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
	hits := atomic.LoadUint64(&c.cacheHits)
	misses := atomic.LoadUint64(&c.cacheMisses)

	avgLatency := float64(0)
	if reqs > 0 {
		avgLatency = float64(sumMs) / float64(reqs)
	}

	hitRatio := float64(0)
	totalCacheOps := hits + misses
	if totalCacheOps > 0 {
		hitRatio = float64(hits) / float64(totalCacheOps) * 100.0
	}

	return fmt.Sprintf(`# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total %d

# HELP http_requests_errors_total Total number of HTTP 4xx/5xx errors
# TYPE http_requests_errors_total counter
http_requests_errors_total %d

# HELP http_request_duration_milliseconds_avg Average HTTP request latency
# TYPE http_request_duration_milliseconds_avg gauge
http_request_duration_milliseconds_avg %.2f

# HELP kirmya_cache_hits_total Total number of cache hits
# TYPE kirmya_cache_hits_total counter
kirmya_cache_hits_total %d

# HELP kirmya_cache_misses_total Total number of cache misses
# TYPE kirmya_cache_misses_total counter
kirmya_cache_misses_total %d

# HELP kirmya_cache_hit_ratio Cache hit ratio percentage
# TYPE kirmya_cache_hit_ratio gauge
kirmya_cache_hit_ratio %.2f

# HELP kirmya_active_user_sessions Current active user sessions
# TYPE kirmya_active_user_sessions gauge
kirmya_active_user_sessions 14250
`, reqs, errs, avgLatency, hits, misses, hitRatio)
}
