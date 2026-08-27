# Kirmya Prometheus Metrics Standard & Instrumentation Catalog

## 1. Core Service Metrics Catalog

| Metric Name | Type | Labels | Description |
| :--- | :--- | :--- | :--- |
| `http_requests_total` | Counter | `method`, `handler`, `status` | Total HTTP requests handled |
| `http_request_duration_seconds` | Histogram | `method`, `handler` | Latency distribution of HTTP requests |
| `db_connection_pool_active` | Gauge | `pool` | Number of active PostgreSQL connections |
| `cache_operations_total` | Counter | `operation`, `result` | Cache operations (hit/miss) |
| `worker_queue_depth` | Gauge | `queue_name` | Number of pending messages in NATS queues |
