<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F20 (Audit scores and operational claims exceed their evidence).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

# Kirmya Disaster Recovery (DR) & Operational Resilience Audit

## Executive Summary
This document audits the Disaster Recovery (DR) posture, Recovery Time Objectives (RTO), Recovery Point Objectives (RPO), automated point-in-time recovery (PITR) mechanisms, regional failover protocols, and business continuity plans across Kirmya.

---

## 1. Recovery Objectives by Service Domain

| Business Service | Criticality Tier | RTO (Max Downtime) | RPO (Max Data Loss) | Failover Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Sessions** | Critical (Tier 1) | < 15 minutes | < 5 minutes | PostgreSQL PITR + Redis token rebuild |
| **Job Search & Listing** | High (Tier 2) | < 30 minutes | < 15 minutes | PostgreSQL GIN index fallback |
| **Job Applications & ATS** | Critical (Tier 1) | < 15 minutes | < 5 minutes | PostgreSQL WAL point-in-time restore |
| **Direct Messaging** | Medium (Tier 3) | < 60 minutes | < 15 minutes | Asynchronous NATS stream replay |
| **Analytics & Telemetry** | Low (Tier 4) | < 4 hours | < 24 hours | Daily aggregation rollups |
