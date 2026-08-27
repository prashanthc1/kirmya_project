# Runbook: PostgreSQL Database Outage & Failover

## 1. Outage Diagnosis
1. Attempt direct connection: `pg_isready -h $DB_HOST -p 5432`.
2. Inspect connection pool saturation in `pgxpool` metrics.
3. Check PostgreSQL storage disk usage on Railway / AWS RDS.

---

## 2. Remediation Steps
1. Terminate long-running blocking locks: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 minutes';`.
2. If primary node is non-responsive, execute failover to secondary replica.
3. Update `DATABASE_URL` secret and trigger rolling backend container restart.
