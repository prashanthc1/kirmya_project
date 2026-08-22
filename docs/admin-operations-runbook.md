# Kirmya Platform Operations Runbook

## Overview
This runbook documents step-by-step procedures for platform operators and site reliability engineers (SREs) managing Kirmya during standard operations and emergency incidents.

---

## 1. Incident Response Procedures

### Scenario A: Database Connection Pool Exhaustion / High Latency
1. **Symptoms**: API latency > 500ms, 504 Gateway Timeouts, `SystemHealth.DatabaseStatus` degraded.
2. **Diagnosis**:
   - Check `/api/v1/admin/system/health` for PostgreSQL pool metrics.
   - Inspect active connection counts and slow query logs.
3. **Mitigation**:
   - Enable Read-Only Mode or disable heavy analytics recalculation jobs via Feature Flags (`analytics_bg_worker = false`).
   - Scale DB pool connection limit or restart secondary replica nodes.

### Scenario B: Redis / Cache Outage
1. **Symptoms**: Session verification latency spike, rate-limiting warnings.
2. **Diagnosis**: `SystemHealth.RedisStatus` reporting `Degraded` or `Offline`.
3. **Mitigation**:
   - Platform automatically falls back to in-memory cache and PostgreSQL session verification.
   - Restart Redis cluster nodes.

### Scenario C: NATS / Event Bus Disruption
1. **Symptoms**: Background notification delay, analytics ingestion lag.
2. **Diagnosis**: `SystemHealth.QueueStatus` shows growing backlog in NATS topics.
3. **Mitigation**:
   - In-memory event dispatch fallback activates automatically.
   - Trigger worker queue drain via `/api/v1/admin/system/jobs`.

### Scenario D: High Fraud / Spam Attack Wave
1. **Symptoms**: Sudden surge in job reports, suspicious user registrations.
2. **Diagnosis**: Check `/admin/trust-safety` moderation queue and Bot Detection risk scores.
3. **Mitigation**:
   - Enable strict CAPTCHA / Bot mitigation feature flag (`strict_bot_protection = true`).
   - Bulk suspend flagged unverified accounts via `/api/v1/admin/users/bulk-suspend`.

---

## 2. Emergency Procedures

### Scheduling Platform Maintenance Mode
1. Navigate to `/admin/maintenance`.
2. Enter explicit maintenance reason (e.g., "PostgreSQL major version upgrade v16 -> v17").
3. Set optional start time and activate.
4. Verify non-admin requests receive `503 Service Unavailable (Maintenance Mode)` while administrators retain full access.

### Support Impersonation Protocol
1. Open user profile in `/admin/users/[id]`.
2. Click **Request Support Impersonation**.
3. Input mandatory support ticket reference (e.g., "Ticket #9482").
4. Session expires automatically after 15 minutes. All actions are logged to immutable audit records.
