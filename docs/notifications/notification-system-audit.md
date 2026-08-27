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
