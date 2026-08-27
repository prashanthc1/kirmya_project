# Kirmya Performance & Stress Testing Harness

## 1. Load Testing Profiles (k6)
- **Normal Traffic**: 500 concurrent Virtual Users (VUs) sustaining 2,500 RPS across discovery endpoints.
- **Spike Traffic**: 2,000 concurrent VUs testing Redis single-flight cache deduplication and DB connection pooling limits.
- **Target SLOs**: P50 < 35ms, P95 < 120ms, P99 < 250ms under peak load.
