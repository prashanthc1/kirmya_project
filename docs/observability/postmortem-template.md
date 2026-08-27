# Kirmya Blameless Incident Postmortem Template

## Incident Metadata
- **Incident Title**: [SEV-X] Brief summary of incident
- **Date & Time (UTC)**: YYYY-MM-DD HH:MM to HH:MM UTC
- **Incident Commander**: Name / Role
- **Customer Impact**: Number of impacted users, error rate spike, duration

---

## 1. Executive Summary
High-level summary of what happened, why it happened, and how it was mitigated.

---

## 2. Timeline (UTC)
- `HH:MM` - Anomaly detected via automated alert
- `HH:MM` - Incident Commander joins incident bridge
- `HH:MM` - Root cause identified
- `HH:MM` - Mitigation deployed
- `HH:MM` - SLO metrics return to nominal baseline

---

## 3. Root Cause Analysis (5 Whys)
Detailed analysis explaining the systemic contributing factors.

---

## 4. Preventive Action Items
| Action Item | Type | Owner | Target Date | Status |
| :--- | :--- | :--- | :--- | :--- |
| Add circuit breaker to provider X | Prevent | Backend Lead | YYYY-MM-DD | Open |
