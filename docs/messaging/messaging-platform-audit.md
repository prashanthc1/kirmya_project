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

# Kirmya Real-Time Messaging & Direct Communication Platform Audit

## Executive Summary
This document audits the 1-to-1 Direct Messaging architecture, WebSocket real-time delivery pipeline, conversation state management, attachment verification, message search indexing, typing/presence engine, and mutual block privacy enforcement.

---

## 1. Messaging Ecosystem Overview
- **PostgreSQL Source of Truth**: All conversations, messages, and delivery states persist reliably in PostgreSQL.
- **WebSocket & Redis Pub/Sub**: Real-time message broadcasting, typing indicators, and presence updates operate on an ephemeral Redis pub/sub layer without being the permanent source of truth.
- **Strict Bidirectional Block Enforcement**: Blocked users are immediately stripped from active conversations and prevented from initiating direct messages.
- **Attachment Verification**: Message attachments are scanned for MIME integrity and restricted to 10MB; file downloads require short-lived signed URLs.
