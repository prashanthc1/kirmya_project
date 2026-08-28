# Kirmya SRE Incident Response Runbooks

Comprehensive step-by-step mitigation runbooks for production emergencies and outage response.

## Operational Runbooks Index

1. **API Gateway Degradation / High 5xx Rates**:
   - Inspect active pod restart counts and check `/api/v1/healthz`.
   - Scale backend pods horizontally if CPU utilization exceeds 85%.
   - Inspect recent deployment commit diffs and trigger immediate rollback if regressions are identified.

2. **Database Connection Pool Saturation**:
   - Query `pg_stat_activity` for long-running idle or blocking queries.
   - Terminate rogue idle transactions: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND state_change < current_timestamp - INTERVAL '5 minutes';`.
   - Scale PostgreSQL connection pooler limits safely.

3. **OpenSearch Outage & PostgreSQL Fallback**:
   - Verify that search automatically switched to PostgreSQL trigram full-text mode.
   - Inspect OpenSearch cluster health: `GET /_cluster/health`.
   - Trigger index re-sync once the OpenSearch cluster returns to green/yellow status.

4. **Redis Cache Eviction & Failure**:
   - Confirm application continues serving traffic via PostgreSQL direct fallback.
   - Restart Redis container and verify memory utilization after connection re-establishment.

5. **NATS JetStream Queue Backlog**:
   - Inspect unacknowledged message counts per consumer subject.
   - Scale worker replicas to accelerate event drain rate.
