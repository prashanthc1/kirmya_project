# Kirmya Performance & Stress Testing Suite

## 1. Load Testing Profiles (k6)
- **Normal Load**: 500 concurrent virtual users (VUs) simulating job search, filtering, and application submission.
- **Stress Spike**: 2,000 concurrent VUs testing Redis single-flight cache stampede protection and PostgreSQL connection pool resilience.
- **Target SLOs**: P50 < 50ms, P95 < 250ms, P99 < 500ms under full load.
