# SRE Runbook: PostgreSQL Database Operations & Incident Triage

## 1. Connection Saturation Triage
1. Inspect active connections: `SELECT count(*), state FROM pg_stat_activity GROUP BY state;`.
2. Terminate idle-in-transaction connections holding locks: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND state_change < now() - interval '5 minutes';`.
3. If pool is exhausted, scale connection pool max connections or deploy PgBouncer connection pooling tier.
