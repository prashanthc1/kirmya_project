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

# Kirmya Data Architecture, Governance & Privacy-by-Design Audit

## Executive Summary
This document audits the authoritative PostgreSQL schema, referential integrity rules, 5-tier data classification hierarchy, automated retention engines, DSAR machine-readable exports, 30-day graceful deletion workflows, and irreversibly anonymized analytics aggregates.

---

## 1. Five-Tier Data Classification Hierarchy

| Level | Classification | Examples | Storage & Encryption | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **L1** | **Public** | Approved Job Postings, Public Organization Profiles | PostgreSQL, OpenSearch, CDN Cached | World-readable |
| **L2** | **Internal** | Application Categories, Industry Skill Taxonomies | PostgreSQL, Redis In-Memory | Authenticated Users |
| **L3** | **Confidential**| User Profile Bios, Work Experience, Education | PostgreSQL, At-Rest Encrypted | Resource Owner + Connections |
| **L4** | **Sensitive** | Job Applications, Resumes, Candidate Scorecards | PostgreSQL, S3 Encrypted, Pre-Signed URLs | Candidate + Hiring Org Recruiter |
| **L5** | **Highly Sensitive**| Bcrypt Password Hashes, MFA TOTP Secrets, Audit Logs | PostgreSQL Dedicated Tablespace, Redacted in Logs | Auth Subsystem / Super Admin Only |
