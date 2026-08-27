# Kirmya SRE Operations Runbook Index

## 1. Subsystem Failure Runbooks
- [`runbooks/api-outage.md`](runbooks/api-outage.md): High API error rates, container crashes, and latency spikes.
- [`runbooks/database-outage.md`](runbooks/database-outage.md): PostgreSQL connection pool exhaustion, table lock contention, and failover.
- [`runbooks/redis-outage.md`](runbooks/redis-outage.md): Redis cluster partition, memory eviction spikes, and cache rebuilds.
- [`runbooks/nats-outage.md`](runbooks/nats-outage.md): NATS JetStream consumer lag and message replay.
- [`runbooks/opensearch-outage.md`](runbooks/opensearch-outage.md): OpenSearch cluster unavailability and fallback to PostgreSQL GIN indexes.
- [`runbooks/worker-backlog.md`](runbooks/worker-backlog.md): Background job queue saturation and poison-pill DLQ isolation.
- [`runbooks/external-provider-outage.md`](runbooks/external-provider-outage.md): Third-party email (SES/SendGrid) or AI (LLM) timeout handling.
