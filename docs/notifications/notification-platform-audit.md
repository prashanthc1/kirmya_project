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

# Kirmya Notification, Alerts & Communication Preferences Audit

## Executive Summary
This document audits the complete Notification Pipeline, In-App Delivery Center, Email Service, Channel Delivery Matrix (In-App, Email, Push), Deduplication Engine, Quiet Hours Enforcer, and Admin Dead-Letter Queue across Kirmya.

---

## 1. Notification Capabilities Overview
- **Multi-Channel Delivery Engine**: In-app notifications with real-time WebSocket sync, responsive email notifications via SMTP/SendGrid, and browser push notification readiness.
- **Event-Driven Architecture**: Decoupled NATS JetStream event publishing with deterministic `IdempotencyKey` deduplication.
- **Granular User Preferences**: Channel delivery matrix per category (`Security`, `Jobs`, `Applications`, `Interviews`, `Networking`, `Messaging`, `Communities`), Do Not Disturb Quiet Hours, and Daily/Weekly Digest settings.
- **Critical Alert Guarantees**: High-priority security and account recovery notifications bypass normal quiet hours and marketing toggles.
