# SRE Runbook: Regional Infrastructure & Database Failover

## 1. Trigger Conditions
Execute regional failover if primary hosting region experiences:
- Complete network partition lasting > 15 minutes.
- Irrecoverable hardware failure on primary PostgreSQL cluster.

---

## 2. Execution Steps
1. Promote read-replica in secondary region to primary read-write status.
2. Update DNS CNAME / A records via Cloudflare API to point to secondary API cluster.
3. Verify backend readiness via `curl -f https://api.kirmya.com/health/readiness`.
