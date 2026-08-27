# Runbook: API Outage & Service Disruption Response

## 1. Triage & Diagnosis
1. Inspect HTTP status code distribution in OpenTelemetry dashboard.
2. Check backend container logs on Railway: `railway logs --service backend`.
3. Check memory and CPU utilization.
4. Verify database readiness: `curl -f https://api.kirmya.com/health/readiness`.

---

## 2. Immediate Remediation
1. If container is OOM-killed, temporarily scale container memory limit or restart instance.
2. If database connection pool is saturated, inspect active queries via `pg_stat_activity`.
3. If bad deployment caused regression, trigger instant rollback.
