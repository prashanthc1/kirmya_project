# Runbook: Rapid Deployment Rollback Protocol

## 1. Rollback Decision Criteria
Trigger an immediate rollback if post-deployment checks reveal:
- Error rate > 1% over a 5-minute rolling window.
- P95 latency > 1000ms.
- Health check readiness probe fails.

---

## 2. Execution Steps
- **Backend (Railway)**: Select previous stable deployment in Railway Dashboard or execute `railway rollback`.
- **Frontend (Vercel)**: Promote previous deployment artifact instantly in Vercel Deployment History.
- **Verification**: Verify `/health/readiness` and run synthetic health checks.
