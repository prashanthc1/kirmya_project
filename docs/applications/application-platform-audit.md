<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F01 (Application timeline omits candidate ownership); F03 (Candidate document registration returns 201 without saving); F04 (Application form drops contact edits and resume URL); F05 (Saved jobs use the wrong response shape); F13 (Job alert writes and several reads hide database errors); F14 (Application analytics present synthetic scores as personalized measurements); F17 (Job-specific apply alias validates the body before reading its path ID).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

# Kirmya Job Application & Applicant Tracking Platform Audit

## Executive Summary
This document audits the Candidate Job Application lifecycle, Recruiter ATS Management pipelines, Resume/Document security checks, Interview Scheduling workflows, and Multi-Tenant Employer Data Isolation across Kirmya.

---

## 1. Application Infrastructure Overview
- **Authoritative Persistence**: PostgreSQL is the transactional source of truth for applications, candidate question answers, status history, and private recruiter notes.
- **Strict Multi-Tenant Employer Isolation**: Scoped at the database query layer (`WHERE job_id = $1 AND organization_id = $2`); unauthorized recruiters cannot access candidates from other organizations.
- **Document Access & Pre-Signed URLs**: Resumes and cover letters are stored securely in S3/MinIO with short-lived pre-signed download URLs requiring authenticated recruiter authorization.
- **Fairness & Explainable AI**: AI job matching serves solely as assistive fit guidance; automated rejections based solely on algorithmic scores are prohibited.
