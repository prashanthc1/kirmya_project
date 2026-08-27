# SRE Runbook: Database Outage & Connection Exhaustion

## 1. Outage Triage
1. Check `db_connection_pool_active` gauge vs `max_connections` (50).
2. Execute `SELECT * FROM pg_stat_activity WHERE state != 'idle'` to detect long-running blocking queries.
3. Check PostgreSQL storage disk usage.

---

## 2. Mitigation Steps
1. Kill long-running blocking transactions holding exclusive table locks.
2. If primary node failed, initiate automatic read-replica promotion.
3. Update `DATABASE_URL` and restart backend container instances.
