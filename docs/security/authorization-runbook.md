# SRE Runbook: Authorization Failure & Privilege Escalation Triage

## 1. Unauthorized Access Spike Triage
1. Inspect 403 Forbidden spikes in Grafana (`http_requests_total{status="403"}`).
2. Review security audit logs (`security_audit_events`) for IDOR probing patterns.
3. If an account is suspected of malicious probing, revoke active sessions immediately via admin console: `POST /api/v1/admin/users/:id/revoke-sessions`.
