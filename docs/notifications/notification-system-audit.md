<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F16 (Realtime delivery is process-local despite distributed-broker documentation).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

# Kirmya Unified Notification System Audit

## Executive Summary
This document audits the unified notification engine, multi-channel dispatch pipelines (In-App, Email, Push-Ready), user quiet hours enforcement, template sanitization, deduplication mechanisms, and privacy shielding in Kirmya.

---

## 1. Multi-Channel Notification Flow

```
                     Domain Event (NATS / PubSub)
                                  │
                                  ▼
                    Notification Ingestion Engine
                    ├── Idempotency Deduplication Key
                    ├── User Preferences & Channel Matrix
                    ├── Quiet Hours & Timezone Evaluation
                    └── Mandatory Security Alert Bypass
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
   In-App Notification     Transactional Email     Push Notification
   (PostgreSQL + Redis)   (HTML Sanitized + Rate)    (Mobile Ready)
```

---

## 2. Security & Privacy Safeguards
- **IDOR Protection**: All notification queries enforce recipient ownership (`WHERE recipient_id = caller_id`).
- **Zero Sensitive Data Ingestion**: Passwords, reset tokens, and raw private messages are never logged or stored in notification body fields.
- **Mandatory Security Alerts**: Critical security events (password changed, new login from unrecognized device) bypass user quiet hours and cannot be disabled in communication preferences.
