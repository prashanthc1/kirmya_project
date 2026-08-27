# Kirmya Performance Troubleshooting & Incident Runbooks

## Incident Mitigation Runbooks

### Runbook 1: PostgreSQL Connection Pool Saturation
1. Check `/admin/performance/database` for active connection count and waiting query queues.
2. Identify long-running transactions (> 5s) via `pg_stat_activity` and terminate blocking queries.
3. Verify connection pool max limit settings (`pgxpool.MaxConns = 25`).

### Runbook 2: Redis Latency / Cache Memory Saturation
1. Inspect Redis memory fragmentation and eviction metrics (`INFO memory`).
2. Verify LRU eviction policy (`maxmemory-policy allkeys-lru`).
3. If Redis fails, verify system gracefully degrades to direct PostgreSQL query execution.

### Runbook 3: OpenSearch Search Index Degradation
1. Check OpenSearch cluster health status (`GET /_cluster/health`).
2. Verify worker queue depth for search index updates.
3. Trigger PostgreSQL search fallback mode if OpenSearch response latency exceeds 500ms.
