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

# Kirmya Company & Employer Brand Platform Comprehensive Audit

## Executive Summary
This document audits the Public Company Profiles, Employer Branding Showcase, Organization Verification Badges, Company Following mechanics, Moderated Employee Reviews, and OpenSearch Company Discovery across Kirmya.

---

## 1. Company Ecosystem Overview
- **Authoritative Persistence**: PostgreSQL is the transactional source of truth for company legal profiles, verified badges, follower associations, and moderated reviews.
- **Strict Public vs Private Boundaries**: Public company pages display exclusively verified public metadata, culture statements, and active job openings; internal hiring team discussions and recruiter notes are completely sealed.
- **Verification Integrity**: Company verification badges are granted exclusively through Platform Admin review workflows; self-verification by company admins is blocked.
- **100% Free Employer Presence**: Public branding pages, company following, and job listings are free with zero paid placement fees or sponsored review monetization.
