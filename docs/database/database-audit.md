# Kirmya PostgreSQL Database & Schema Governance Audit

## Executive Summary
This document audits the authoritative PostgreSQL database architecture, 39 relational tables, primary/foreign key cascading integrity, check constraints, GIN/B-tree indexing, pgxpool connection limits, and expand/contract migration safety across Kirmya.

---

## 1. Relational Schema Summary
- **Authoritative Database**: PostgreSQL 16 managed instance via `pgx/pgxpool`.
- **Relational Integrity**: 100% foreign key constraint enforcement across domain boundaries with strict `ON DELETE CASCADE` or `RESTRICT` rules.
- **SQL-First Repository Pattern**: Native parameterized queries via Go `pgxpool` without ORM overhead.
- **Full-Text Fallback Indexing**: `pg_trgm` and `to_tsvector` GIN indexes backing transparent search fallback during OpenSearch maintenance.
