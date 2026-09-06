<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F04 (Application form drops contact edits and resume URL); F05 (Saved jobs use the wrong response shape); F10 (Search discovery is weakened by metadata and job indexing gaps); F17 (Job-specific apply alias validates the body before reading its path ID).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

# Kirmya Job Discovery, Search & Recommendations Platform Audit

## Executive Summary
This document audits the Global Job Search engine, Advanced Filter facets, OpenSearch multi-field indexer, Deterministic & AI Job Recommendations, Saved Search Alerts, and Fair Ranking controls across Kirmya.

---

## 1. Job Discovery Ecosystem Overview
- **Authoritative Source vs Index**: PostgreSQL is the transactional source of truth; OpenSearch acts as a performant search and autocomplete layer with automated event synchronization.
- **Fair & Objective Ranking**: Search rankings rely exclusively on skill match, experience fit, location proximity, and job freshness; protected demographic attributes are strictly excluded.
- **Privacy-Safe User Personalization**: Candidate search history, saved jobs, and recommendation interactions remain private and are never disclosed to recruiters.
- **Zero-Fee Career Recovery**: Job discovery, personalized alerts, and search recommendations remain 100% free with no paid boosting or sponsored post monetization.
