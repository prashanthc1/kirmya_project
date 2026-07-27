# Kirmya Production Incident Response & On-Call Playbook

This document defines the production incident classification, triage protocol, escalation pathways, and remediation runbooks for **Kirmya**.

---

## 🚨 1. Incident Severity Levels

| Severity | Definition | Target Resolution SLA | Escalation Path |
| :--- | :--- | :--- | :--- |
| **P1 - CRITICAL** | Complete platform outage, DB cluster failure, or security breach | **< 15 minutes** | Page Lead SRE & CTO immediately via PagerDuty |
| **P2 - HIGH** | Core feature degraded (Auth down, Search failing, API latency > 2s) | **< 1 hour** | Alert On-Call Engineer |
| **P3 - MEDIUM** | Non-critical feature bug (e.g. recommendation refresh slow) | **< 24 hours** | Create Priority Jira Ticket |
| **P4 - LOW** | Minor cosmetic defect or non-blocking UI glitch | Next Sprint | Log in Backlog |

---

## 🔍 2. Triage & Diagnostic Protocol

### Step 1: Health Check Verification
Execute standard health probe against public and internal endpoints:
```bash
# Check REST API Gateway Health
curl -i https://api.kirmya.com/api/v1/metrics

# Check Frontend Availability
curl -i https://kirmya.vercel.app/
```

### Step 2: Inspect Structured JSON Logs
Search production logs using trace correlation IDs:
```bash
# Filter errors in Railway / Cloud logs
grep '"level":"ERROR"' /var/log/kirmya/app.log | jq .

# Trace specific user request anomaly
grep '"trace_id":"<TRACE_ID>"' /var/log/kirmya/app.log | jq .
```

---

## 📜 3. Automated Remediation Runbooks

### Runbook A: High Database Latency / Pool Exhaustion
1. **Symptoms**: `http_request_duration_milliseconds_avg > 1500ms` or `kirmya_db_query_errors_total` rising.
2. **Diagnosis**: Check active pgxpool connections in Prometheus / Grafana.
3. **Action**:
   - Verify Redis cache status (`kirmya_cache_hit_ratio`).
   - If Redis is down, restart Redis container via Railway/Docker Compose:
     `docker-compose -f docker-compose.production.yml restart redis`
   - Scale DB pool connection limit or restart backend service:
     `docker-compose -f docker-compose.production.yml restart backend`

### Runbook B: Redis Down / Cache Fallback Engaged
1. **Symptoms**: `kirmya_cache_hit_ratio` drops to `0%`.
2. **Behavior**: Backend automatically degrades gracefully to thread-safe `InMemoryCache` fallback engine without dropping HTTP requests.
3. **Action**: Re-establish Redis cluster connection; inspect Redis memory fragmentation.

---

## 📊 4. Post-Mortem Template

Following resolution of any **P1** or **P2** incident, complete a post-mortem within 48 hours containing:
1. **Summary**: Brief description of what occurred.
2. **Timeline**: UTC timeline of detection, triage, mitigation, and resolution.
3. **Root Cause**: 5 Whys analysis explaining the fundamental technical trigger.
4. **Corrective Actions**: Preventative tickets created to eliminate future recurrence.
