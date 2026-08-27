# Kirmya Automated & Manual Deployment Rollback Runbook

## 1. Automated Rollback Trigger Criteria
- HTTP 5xx error rate exceeds 2% sustained for > 3 minutes following deployment.
- Readiness check fails 3 consecutive attempts on newly provisioned containers.
- Latency P95 spikes above 1000ms.

---

## 2. One-Click Rollback Execution
1. Trigger previous release redeployment via Railway CLI: `railway rollback`.
2. Revert Vercel frontend deployment to previous production alias.
3. If database migration requires rollback, apply corresponding `*.down.sql` migration script.
4. Verify system recovery via `GET /health/readiness`.
