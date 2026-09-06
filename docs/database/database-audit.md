<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F02 (Privacy and consent operations return success without persistence); F03 (Candidate document registration returns 201 without saving); F11 (Database-free CI is mistaken for full workflow validation); F13 (Job alert writes and several reads hide database errors); F18 (Production can enter unregistered nil-database fallback mode).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

# Kirmya PostgreSQL Database & Schema Governance Audit

## Executive Summary
This document audits the authoritative PostgreSQL database architecture, 39 relational tables, primary/foreign key cascading integrity, check constraints, GIN/B-tree indexing, pgxpool connection limits, and expand/contract migration safety across Kirmya.

---

## 1. Relational Schema Summary
- **Authoritative Database**: PostgreSQL 16 managed instance via `pgx/pgxpool`.
- **Relational Integrity**: 100% foreign key constraint enforcement across domain boundaries with strict `ON DELETE CASCADE` or `RESTRICT` rules.
- **SQL-First Repository Pattern**: Native parameterized queries via Go `pgxpool` without ORM overhead.
- **Full-Text Fallback Indexing**: `pg_trgm` and `to_tsvector` GIN indexes backing transparent search fallback during OpenSearch maintenance.
