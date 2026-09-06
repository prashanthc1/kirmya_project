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

# Kirmya Search, Discovery & Intelligent Matching Comprehensive Audit

## Executive Summary
This document audits the Global Search Bar, OpenSearch Multi-Cluster Indices, PostgreSQL Trigram/GIN Fallback Engine, Explainable Job & Candidate Match Scoring, and Privacy-Scoped Autocomplete across Kirmya.

---

## 1. Search Ecosystem Overview
- **Hybrid Search Architecture**: Primary high-throughput query routing through OpenSearch with automatic, zero-downtime failover to PostgreSQL full-text and trigram GIN indexes.
- **Strict Authorization & Visibility Boundaries**: Search results strictly filter by viewer authorization; private profiles, hidden resumes, and non-organization applications are excluded prior to result ranking.
- **Fairness & Non-Discrimination**: Demographic attributes and protected characteristics are strictly barred from ranking algorithms, semantic matching vectors, and suggestion models.
- **100% Free Search & Matching**: Universal multi-facet search, candidate discovery, and job alerts are 100% free with zero paywalls.
