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

# Kirmya Platform Analytics, BI & Telemetry System Audit

## Executive Summary
This document audits the platform analytics architecture, event ingestion pipeline, roll-up aggregations, KPI computation engine, recruiter job metrics, and privacy safeguards (minimum group size threshold = 5) in Kirmya.

---

## 1. Multi-Tier Analytics Architecture

```
                    Domain Service Events (NATS / PubSub)
                                      │
                                      ▼
                        Analytics Ingestion Pipeline
                        ├── Event Schema & Metadata Validation
                        ├── User Telemetry Consent Filtering
                        └── Idempotent Deduplication (Redis 24h)
                                      │
                                      ▼
                     PostgreSQL Analytics Event Store
                      ├── Partitioned Event Tables (`analytics_events`)
                      ├── Materialized Views / Rollups (`daily_aggregates`)
                      └── Cohort Grids & Activation Funnels
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
  Admin Control Center        Recruiter Analytics         Personal Career View
 (`/admin/analytics`)      (`/recruiter/analytics`)         (`/analytics`)
```

---

## 2. Privacy & Aggregation Safeguards
- **Minimum Cohort Threshold (k >= 5)**: To prevent reverse-identification of individual user behaviors, aggregate metrics are suppressed or rounded when cohort group sizes fall below 5.
- **Strict Data Minimization**: Message bodies, password hashes, and recruiter internal evaluation notes are stripped prior to event ingestion.
