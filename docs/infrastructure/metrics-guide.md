# Kirmya Golden Signals & Prometheus Metrics Manual

## 1. System Metrics & Golden Signals
- **Latency (Duration)**: HTTP request duration histograms (P50, P95, P99) partitioned by route and status code.
- **Traffic (Rate)**: Incoming requests per second (RPS) tracked per API endpoint and client IP.
- **Errors**: 4xx and 5xx response counters with error-type classification.
- **Saturation**: Database connection pool utilization, Redis memory usage, and background worker queue depth.
