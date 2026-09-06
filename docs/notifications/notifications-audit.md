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

# Kirmya Notification & Multi-Channel Communication Platform Audit

## Executive Summary
This document audits the Centralized Notification Platform, In-App Notification Center, Event-Driven NATS Architecture, Transactional Email Subsystem, Mobile Push Tokens, Channel Delivery Matrices, Idempotency & Deduplication Engine, and Admin Dead-Letter Queue (DLQ) operations.

---

## 1. Notification Infrastructure Overview
- **Persistent Source of Truth**: PostgreSQL stores all in-app notifications, delivery records, user preference matrices, and quiet hours schedules.
- **Event-Driven Broker**: NATS JetStream handles asynchronous dispatching of domain events (`job.alert`, `application.status_changed`, `interview.scheduled`, `security.login_alert`, `messaging.new_message`).
- **Channel Routing Engine**: Matrix-based routing evaluating user category preferences across In-App, Transactional Email, and Mobile Push.
- **Critical Security Override**: Account security and authentication notifications bypass quiet hours and opt-outs.
