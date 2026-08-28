# Kirmya Recruiter, ATS & Candidate Management Architecture

## 1. Architectural Overview

The Kirmya Recruiter & Applicant Tracking System (ATS) enables employers, talent acquisition teams, and recruiting agencies to post job opportunities, track candidate pipelines across Kanban stages, score applicant evaluations, and collaborate on hiring decisions with strict multi-tenant organization boundaries.

```
Recruiter Client (Next.js / MUI v6)
        │
        ▼
Recruiter Delivery Handler (/api/v1/recruiter/...)
        │ (JWT Context Extraction & Org Scoping)
        ▼
Recruiter Service Layer (internal/recruiter/service)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
PostgreSQL (pgxpool)          In-Memory Fallbacks            Notification Service
(Jobs, ATS Stages, Notes)     (Offline & Demo Mode)          (Email & Push Alerts)
```

---

## 2. ATS Pipeline & Candidate Lifecycle

```
[ New / Applied ] ──► [ Screening ] ──► [ Interview ] ──► [ Assessment ] ──► [ Offer Extended ] ──► [ Hired ]
        │                   │                 │                 │
        ▼                   ▼                 ▼                 ▼
   [ Rejected ]        [ Rejected ]      [ Rejected ]      [ Rejected ]
```

1. **Applied**: Initial candidate submission; visible in recruiter's job pipeline.
2. **Screening / Shortlisted**: Recruiter reviews resume and credentials.
3. **Interview Scheduled**: Automated calendar notifications sent to candidate and hiring team.
4. **Assessment & Scorecard**: Structured evaluation submitted (`POST /api/v1/recruiter/applications/:id/evaluate`) rating skills, culture fit, and recommendation (`Strong Yes`, `Yes`, `Neutral`, `No`, `Strong No`).
5. **Offer & Hired**: Formal offer dispatched and finalized.

---

## 3. Multi-Tenant Organization Boundary Controls

- **Organization Scoping**: All job listings, candidate records, private notes, and pipeline stages are strictly scoped by `organization_id`.
- **Zero Cross-Tenant Leakage**: Recruiters can only query or mutate candidate data belonging to their verified company organization (`WHERE organization_id = $1`).
- **Private Candidate Notes**: Internal notes (`/api/v1/recruiter/candidates/:id/notes`) are accessible only by authorized recruiters of that organization and are never exposed to candidates.

---

## 4. REST API Endpoint Directory

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/recruiter/profile` | Recruiter profile & organization membership | Bearer Token |
| `POST` | `/api/v1/recruiter/onboarding` | Recruiter onboarding & company linking | Bearer Token |
| `GET` | `/api/v1/recruiter/overview` | Executive recruiter ATS dashboard metrics | Recruiter RBAC |
| `GET` | `/api/v1/recruiter/jobs` | Organization's posted jobs | Recruiter RBAC |
| `POST` | `/api/v1/recruiter/jobs` | Create new job listing | Recruiter RBAC |
| `GET` | `/api/v1/recruiter/jobs/:id` | View specific job details & applicant count | Recruiter RBAC |
| `PUT` | `/api/v1/recruiter/jobs/:id` | Update job posting | Recruiter RBAC |
| `POST` | `/api/v1/recruiter/jobs/:id/close` | Close / expire job posting | Recruiter RBAC |
| `GET` | `/api/v1/recruiter/pipeline` | Kanban ATS pipeline across stages | Recruiter RBAC |
| `POST` | `/api/v1/recruiter/applications/:id/stage` | Move candidate to target pipeline stage | Recruiter RBAC |
| `GET` | `/api/v1/recruiter/applications/:id/history` | Audit trail of candidate stage transitions | Recruiter RBAC |
| `POST` | `/api/v1/recruiter/applications/:id/evaluate` | Submit structured candidate scorecard | Recruiter RBAC |
| `GET` | `/api/v1/recruiter/applications/:id/evaluations` | List candidate evaluations | Recruiter RBAC |
| `POST` | `/api/v1/recruiter/candidates/:id/notes` | Add internal recruiter note | Recruiter RBAC |
| `GET` | `/api/v1/recruiter/candidates/:id/notes` | View internal candidate notes | Recruiter RBAC |
| `POST` | `/api/v1/recruiter/applications/bulk-stage` | Bulk move candidates across stages | Recruiter RBAC |
