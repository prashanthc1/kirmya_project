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

# Kirmya Candidate Career Identity & Profile Platform Audit

## Executive Summary
This document audits the Candidate Professional Profile system, Multi-Version Resume Builder, Experience & Skills Taxonomy, Recruiter Visibility Controls, and AI Job Fit Assistance across Kirmya.

---

## 1. Profile Infrastructure Overview
- **Authoritative Persistence**: PostgreSQL is the transactional source of truth for user profiles, work experiences, education histories, skill proficiencies, and resume versions.
- **Privacy & Visibility Granularity**: Granular controls (`Public`, `Recruiter-Visible`, `Connections-Only`, `Private`) evaluated at query level to shield sensitive career history and contact details.
- **Secure Resume Management**: Pre-signed S3 download links with 15-minute expiration; public permanent file access is strictly blocked.
- **Explainable AI Career Fit**: AI assistance provides transparent skill-gap suggestions without driving irreversible hiring decisions.
