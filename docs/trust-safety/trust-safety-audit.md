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

# Kirmya Trust & Safety Platform Audit

## Executive Summary
This document audits the Trust & Safety architecture, User/Content Reporting Pipelines, Fraud & Fake Job Detection, Moderation Desk, Progressive Restrictions, Account Suspensions, and Appeals Lifecycle across Kirmya.

---

## 1. Safety Ecosystem Overview
- **Multi-Entity Reporting Pipeline**: Users can report users, jobs, communities, posts, comments, direct messages, and organizations with controlled categorization (`Spam`, `Harassment`, `Scam`, `Fraud`, `Misleading`, `Illegal`).
- **Fraud Detection Engine**: Algorithmic scoring for advance-fee requests, credential theft, fake recruiter identities, and abnormal recruitment outreach velocity.
- **Progressive Enforcement State Machine**: `Warning` -> `Feature Restriction` (messaging/posting disabled) -> `Temporary Suspension` -> `Permanent Ban` with human-in-the-loop review for high-impact actions.
- **Fair & Independent Appeals**: Enforced 14-day appeal window reviewed by an independent Senior Moderator with complete audit trail.
