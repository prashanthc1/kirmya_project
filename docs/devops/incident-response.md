# Kirmya Security & Operations Incident Response Runbook

## 1. Incident Severity Classification

| Level | Definition | Response SLA | Command Lead |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Core platform outage / active security breach | < 15 minutes | Lead DevOps Engineer |
| **SEV-2 (Major)** | Major feature failure (e.g. ATS / Job Applications down) | < 30 minutes | Backend Tech Lead |
| **SEV-3 (Minor)** | Non-blocking UI glitch / minor background worker delay | < 4 hours | Duty Engineer |

---

## 2. Post-Incident Review & Root Cause Analysis (RCA)
Every SEV-1 and SEV-2 incident requires a blameless postmortem within 48 hours to document timeline, impact, root causes, and preventive action items.
