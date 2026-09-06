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

# Kirmya Trust & Safety, Moderation & Abuse Prevention Audit

## Executive Summary
This document audits the Trust & Safety architecture, content moderation queues, user reporting pipelines, account enforcement ladders, appeals workflows, AI moderation assistance, and reporter identity privacy shielding in Kirmya.

---

## 1. Moderation Pipeline & Case Lifecycle

```
                    User Report / Automated Classifier Signal
                                       │
                                       ▼
                        Moderation Queue Ingestion
                        ├── Priority Assignment (P1-Critical to P4-Low)
                        ├── Category Triage (Spam, Fraud, Harassment)
                        └── Anti-Duplication Grouping
                                       │
                                       ▼
                        Human Review & Investigation
                        ├── Evidence Verification (Sanitized)
                        ├── Internal Case Comments (Shielded)
                        └── Case Locking (Conflict Prevention)
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
      [Warning / Info]         [Content Removal]         [Account Suspension]
            │                          │                          │
            └──────────────────────────┴──────────────────────────┘
                                       │
                                       ▼
                         Appeals Desk (`/appeals`)
```

---

## 2. Ethical Safeguards & Human Authority
- **Reporter Identity Shielding**: The identity of the reporting user is strictly confidential and never exposed to the reported target.
- **Human Authority on High-Impact Actions**: Automated AI classifiers assist with priority ranking; account suspensions and content takedowns require verification by an authorized moderator.
