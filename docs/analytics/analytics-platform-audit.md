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

# Kirmya Analytics, Reporting & Business Intelligence Comprehensive Audit

## Executive Summary
This document audits the Centralized Analytics Pipeline, User Activation Funnels, Cohort Retention Grids, Recruiter Performance Metrics, Privacy-Preserving Thresholds, and Data Retention Policies across Kirmya.

---

## 1. Analytics & BI Ecosystem Overview
- **Authoritative Metrics Storage**: PostgreSQL serves as the definitive analytical repository with materialized views and transactional event tables.
- **Strict Privacy Safeguards & Thresholding**: Cohort aggregates enforce a minimum privacy group size (`MinPrivacyThreshold = 5`) to prevent individual de-anonymization.
- **Zero Protected Attribute Profiling**: Analytics engines are strictly barred from aggregating or segmenting data based on race, religion, gender, disability, or other protected characteristics.
- **Multi-Tenant Organization Scoping**: Recruiter and employer metrics enforce tenant boundary checks (`WHERE organization_id = $1`) preventing cross-enterprise data leakage.
