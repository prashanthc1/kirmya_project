# Kirmya Background Worker & Event Queue Concurrency

## 1. Worker Concurrency & Backpressure
- **Bounded Worker Pools**: Fixed-size goroutine pools (default 20 workers per consumer) prevent unbounded memory growth during traffic bursts.
- **Batch Processing**: Email, notification, and search indexing events are processed in micro-batches of up to 50 items.
- **Dead-Letter Queue (DLQ)**: Failed tasks undergo exponential backoff retries (max 5 attempts) before diversion to `kirmya.dlq` for operator triage.
