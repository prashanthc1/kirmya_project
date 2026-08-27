# Kirmya Operational Monitoring & OpenTelemetry Infrastructure

## 1. OpenTelemetry Trace & Metric Instruments
- **HTTP Middlewares**: Injects W3C TraceContext headers (`traceparent`, `tracestate`) across all Gin requests.
- **Latency Gauges**: P50, P95, and P99 latency meters for database queries, Redis cache access, and OpenSearch query execution.
- **Worker Queue Health**: Background job queue depth and DLQ failure rate counters.
