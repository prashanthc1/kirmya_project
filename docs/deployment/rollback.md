# Kirmya Automated Rollback & Incident Recovery Strategy

## 1. Rollback Triggers
An automated or manual production rollback is initiated if any of the following criteria are triggered during the post-deployment observation window (15 minutes):
- **Health Check Failures**: Application readiness probe fails for 3 consecutive intervals.
- **Error Spike**: HTTP 5xx error rate exceeds 1% of total request traffic.
- **Latency Regression**: P95 API latency degrades beyond 500ms.
- **Critical Workflow Failure**: Automated release smoke test fails.

---

## 2. Rollback Execution Steps

1. **Traffic Re-routing**: Immediate blue-green load balancer switch back to the previous stable release container pool (`kirmya-backend:${PREVIOUS_STABLE_SHA}`).
2. **Worker Draining**: Gracefully signal new workers to stop accepting incoming NATS/event jobs and allow in-flight jobs to finish cleanly.
3. **Database Schema Shielding**: Because migrations follow the Expand/Contract protocol, schema additions remain backward compatible with the previous application version.
4. **Audit Incident Logging**: Log production rollback event in the Admin Incident Control Center (`/admin/system/health/incidents`).
