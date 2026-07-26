# Kirmya Performance & Scale Audit Report

This report outlines the performance optimizations, query indexes, and scaling configurations implemented to prepare the Kirmya professional ecosystem for production-grade workloads.

---

## 1. Caching & Cache Stampede Mitigation

### Caching Architecture
We implement a **Cache-Aside (Lazy Loading)** pattern for user profiles, job summaries, and notifications:
- Read requests query Redis.
- Cache misses query PostgreSQL, populate Redis, and set an explicit TTL.

### Cache Stampede Prevention
High-concurrency cache misses on hot keys (e.g., popular job openings queried by thousands of users simultaneously) can overwhelm PostgreSQL. To prevent this, we integrate **Single-Flight query deduplication** in Go (`golang.org/x/sync/singleflight`):
```go
import "golang.org/x/sync/singleflight"

var requestGroup singleflight.Group

func GetUserProfile(userID string) (Profile, error) {
    // 1. Try Cache
    val, _ := cache.Get("kirmya:profile:user:" + userID)
    if val != "" {
        return parse(val), nil
    }

    // 2. Deduplicate concurrent DB requests using singleflight
    result, err, _ := requestGroup.Do(userID, func() (interface{}, error) {
        profile, err := db.LoadProfile(userID)
        if err == nil {
            cache.Set("kirmya:profile:user:"+userID, serialize(profile), 24*time.Hour)
        }
        return profile, err
    })
    
    return result.(Profile), err
}
```
*Result*: On 1,000 concurrent cache misses, only 1 query is dispatched to PostgreSQL, and the result is shared across all 1,000 callers.

---

## 2. Structured Logging & OpenSearch Shimming

To enable enterprise-grade analytics and log collation:
- We migrated from standard standard-library `log` prints to structured JSON logs using Go's `log/slog` handlers.
- **Request Trace format**:
  `{"time":"2026-07-25T11:40:00Z","level":"INFO","msg":"Request handled successfully","status":200,"method":"GET","path":"/api/v1/messaging/conversations","latency":342000,"ip":"127.0.0.1"}`
- **OpenSearch Collector**: Local compose defines an OpenSearch node. In production, logs written to standard output (`os.Stdout`) are captured by a Logstash or FluentBit daemon, shipped directly to an OpenSearch index, and visualized in dashboards.

---

## 3. Cloudflare CDN Caching Strategy

Static assets (Next.js bundle files, images) are offloaded to Cloudflare's edge CDN, minimizing origin server workload.
- **Cache Directives**:
  - CSS, JS, and font files: `Cache-Control: public, max-age=31536000, immutable`.
  - Static avatars/logos: `Cache-Control: public, max-age=604800, stale-while-revalidate=86400`.
- **WAF Rule Engine**: Cloudflare is configured to block automated scraping on the search and job recommendation endpoints while permitting authenticated API requests.

---

## 4. OpenTelemetry Observability

Our infrastructure runs an `otel-collector` container receiving OTLP traces and metrics.
- **Metrics Collection**: Prometheus metrics are exposed at port `:8889` for consumption by Grafana.
- **Distributed Tracing**: Context propagation is injected into HTTP request headers (using W3C trace context format), linking trace IDs from the Next.js client request down to Go service handlers and SQL queries.

---

## 5. Database Indexing & Optimizations

To support rapid, low-latency lookups, the following database index schema strategies have been deployed:

| Table Name | Column Name(s) | Index Type | Optimization Goal |
| :--- | :--- | :--- | :--- |
| `usr_accounts` | `email` | `UNIQUE btree` | Fast credentials queries and timing attack defense. |
| `refresh_tokens` | `token` | `UNIQUE btree` | Rapid session validation and rotation lookup. |
| `notifications` | `user_id, created_at` | `btree` | Fast retrieval of user alert feeds (newest first). |
| `messages` | `conversation_id, created_at`| `btree` | High-speed message rendering within active chat threads. |
