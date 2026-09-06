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

# Kirmya Recruiter, Employer & Organization Management Platform Audit

## Executive Summary
This document audits the Organization Hierarchy, Company Profiles, Multi-Tenant Hiring Workspaces, Recruiter RBAC Permissions, Job Ownership, Candidate Triage, and Auditability across Kirmya.

---

## 1. Recruiter Infrastructure Overview
- **Authoritative Persistence**: PostgreSQL is the transactional source of truth for organization structures, hiring workspaces, member roles, and candidate notes.
- **Strict Multi-Tenant Employer Isolation**: Scoped at the database query layer (`WHERE organization_id = $1`); recruiters from Organization A can never access Organization B's candidates, jobs, or private notes.
- **Granular RBAC Permission Matrix**: Explicit role assignments (`Owner`, `Admin`, `Recruiter`, `Hiring Manager`, `Interviewer`, `Viewer`) evaluated server-side on every API mutation.
- **Zero Fees Guarantee**: Employer workspaces, job postings, and candidate messaging are 100% free for organizations and job seekers.
