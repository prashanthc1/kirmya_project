# Kirmya Service Dependency & Failure Mode Map

## 1. System Dependencies & Fallback Behavior

| Service Dependency | Criticality | Behavior When Unavailable | Fallback Mechanism |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | High | Core API requests fail with 503 | Read-replica failover |
| **Redis** | Medium | Cache misses, rate-limits degrade | In-memory token bucket & Direct DB queries |
| **NATS Event Bus** | Medium | Asynchronous events buffered | In-memory channel queue |
| **OpenSearch** | Low | Full-text candidate/job search degrades | PostgreSQL ILIKE / tsvector fallback |
| **Email Provider (SES/SMTP)**| Low | Outbox emails queued | Exponential backoff retry & DLQ |
