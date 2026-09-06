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

# Kirmya Recruiter & Employer Platform Comprehensive Audit

## Executive Summary
This document audits the Multi-Tenant Organization Hierarchy, Company Profiles, Employer Verification, Recruiter RBAC Permissions, Talent Pools, Saved Candidate bookmarks, and Anti-Scraping controls across Kirmya.

---

## 1. Recruiter Ecosystem Overview
- **Authoritative Source of Truth**: PostgreSQL persists organizations, hiring teams, role permissions, talent pool bookmarks, and private candidate notes.
- **Strict Multi-Tenant Query Boundaries**: Queries enforce `WHERE organization_id = $1` preventing cross-tenant leakage of candidate evaluations or job openings.
- **Candidate Privacy Boundaries**: Candidate private search behavior, bookmark history, and unshared application records are never exposed to recruiters.
- **Free for Job Seekers & Employers**: Zero candidate search paywalls, zero resume viewing fees, and zero recruiter seat monetization.
