# Kirmya Job Application & Applicant Tracking Platform Audit

## Executive Summary
This document audits the Candidate Job Application lifecycle, Recruiter ATS Management pipelines, Resume/Document security checks, Interview Scheduling workflows, and Multi-Tenant Employer Data Isolation across Kirmya.

---

## 1. Application Infrastructure Overview
- **Authoritative Persistence**: PostgreSQL is the transactional source of truth for applications, candidate question answers, status history, and private recruiter notes.
- **Strict Multi-Tenant Employer Isolation**: Scoped at the database query layer (`WHERE job_id = $1 AND organization_id = $2`); unauthorized recruiters cannot access candidates from other organizations.
- **Document Access & Pre-Signed URLs**: Resumes and cover letters are stored securely in S3/MinIO with short-lived pre-signed download URLs requiring authenticated recruiter authorization.
- **Fairness & Explainable AI**: AI job matching serves solely as assistive fit guidance; automated rejections based solely on algorithmic scores are prohibited.
