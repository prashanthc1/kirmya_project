# Kirmya ATS (Applicant Tracking System) — Architecture & Operations Guide

## Overview

The Kirmya ATS module provides production-grade recruitment and applicant tracking capabilities built into the Kirmya professional networking platform. It enables recruiters to manage job postings, track candidate pipelines, coordinate interviews, evaluate candidates, and manage offers — all with strict company isolation, RBAC enforcement, and privacy audit logging.

## Architecture

```
Frontend (Next.js + MUI v6)                  Backend (Go + Gin)
┌─────────────────────────┐                  ┌───────────────────────────────────┐
│  /recruiter/dashboard   │─── HTTP ────────▶│  RecruiterHandler (delivery/http) │
│  /recruiter/jobs        │                  │         │                         │
│  /recruiter/pipeline    │                  │  RecruiterService (service)       │
│  /recruiter/candidates  │                  │         │                         │
│  /recruiter/interviews  │                  │  RecruiterRepository (repository) │
│  /recruiter/applications│                  │         │                         │
│  /recruiter/offers      │                  │    PostgreSQL (pgxpool)           │
│  /recruiter/analytics   │                  └───────────────────────────────────┘
└─────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| **Handler** (`delivery/http/`) | HTTP request parsing, input validation, UUID parsing, error status codes |
| **Service** (`service/`) | Business logic, RBAC verification, company isolation, audit logging, input defaults |
| **Repository** (`repository/`) | PostgreSQL queries, data access, fallback data for nil-DB development |

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `recruiter_organization_profiles` | Recruiter identity scoped to an org (user_id + org_id) |
| `recruiter_role_permissions` | RBAC permission matrix per role |
| `recruiter_jobs` | Jobs posted by recruiters |
| `job_application_questions` | Custom screening questions per job |
| `job_applications` | Candidate applications with stage tracking |
| `candidate_pipeline` | Kanban pipeline state per job+candidate |
| `application_stage_history` | Audit trail of all stage transitions |
| `interviews` | Scheduled interviews |
| `interview_feedback` | Structured interview feedback scores |
| `candidate_evaluations` | Structured candidate evaluation scoring |
| `job_offers` | Offer management and status tracking |
| `candidate_assignments` | Recruiter-to-application assignment |
| `recruiter_internal_notes` | Org-scoped recruiter notes on candidates |
| `candidate_org_tags` | Organization-scoped candidate tags |
| `candidate_tag_assignments` | Tag-to-candidate mappings |
| `recruiter_message_templates` | Reusable communication templates |
| `candidate_access_logs` | Privacy audit trail for candidate data access |
| `candidate_pipeline_stages` | Custom pipeline stages per organization |

## API Endpoints

### Profile & Onboarding
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/recruiter/profile` | Get recruiter profile |
| `POST` | `/recruiter/onboarding` | Submit onboarding |
| `GET` | `/recruiter/dashboard` | Dashboard overview KPIs |

### Job Management
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/recruiter/jobs` | List recruiter's jobs |
| `POST` | `/recruiter/jobs` | Create a job |
| `GET` | `/recruiter/jobs/:id` | Get job details |
| `POST` | `/recruiter/jobs/:id/publish` | Publish a job |
| `POST` | `/recruiter/jobs/:id/pause` | Pause a job |
| `POST` | `/recruiter/jobs/:id/close` | Close a job |
| `GET` | `/recruiter/jobs/:id/matches` | Get candidate matches for a job |

### Candidate Search & Discovery
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/recruiter/candidates/search` | Search candidates |
| `GET` | `/recruiter/candidates/filters` | Get filter facets |
| `GET` | `/recruiter/candidates/saved` | Get saved candidates |
| `GET` | `/recruiter/candidates/recommendations` | AI recommendations |
| `POST` | `/recruiter/candidates/compare` | Compare candidates |
| `GET` | `/recruiter/candidates/:id` | Candidate detail |
| `POST` | `/recruiter/candidates/:id/save` | Save a candidate |
| `DELETE` | `/recruiter/candidates/:id/save` | Unsave a candidate |
| `POST` | `/recruiter/candidates/:id/message` | Message a candidate |
| `POST` | `/recruiter/candidates/:id/connect` | Connect with candidate |

### Candidate Notes & Evaluations
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/recruiter/candidates/:id/notes` | Create a recruiter note |
| `GET` | `/recruiter/candidates/:id/notes` | Get candidate notes (org-scoped) |
| `POST` | `/recruiter/applications/:id/evaluate` | Submit candidate evaluation |
| `GET` | `/recruiter/applications/:id/evaluations` | Get application evaluations |
| `GET` | `/recruiter/applications/:id/history` | Get stage transition history |

### ATS Pipeline & Applications
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/recruiter/applications` | List applications (filterable) |
| `GET` | `/recruiter/applications/:id` | Application detail |
| `POST` | `/recruiter/applications/bulk` | Bulk update applications |
| `GET` | `/recruiter/pipeline/:jobId` | Get pipeline for a job |
| `PUT` | `/recruiter/pipeline/:id` | Update pipeline stage |
| `PUT` | `/recruiter/applications/:id/stage` | Update application stage |

### Interviews & Feedback
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/recruiter/interviews` | List interviews |
| `POST` | `/recruiter/interviews` | Schedule an interview |
| `POST` | `/recruiter/interviews/:id/feedback` | Submit interview feedback |

### Offers
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/recruiter/offers` | Create a job offer |
| `PUT` | `/recruiter/offers/:id` | Update offer status |
| `GET` | `/recruiter/applications/:id/ai-eval` | Get AI evaluation |

### Team, Templates & Analytics
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/recruiter/team` | List team members |
| `GET` | `/recruiter/templates` | Message templates |
| `GET` | `/recruiter/analytics` | Recruiting analytics |

### Saved Searches & Talent Pools
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/recruiter/saved-searches` | List saved searches |
| `POST` | `/recruiter/saved-searches` | Create saved search |
| `DELETE` | `/recruiter/saved-searches/:id` | Delete saved search |
| `GET` | `/recruiter/talent-pools` | List talent pools |
| `POST` | `/recruiter/talent-pools` | Create talent pool |
| `DELETE` | `/recruiter/talent-pools/:id` | Delete talent pool |
| `POST` | `/recruiter/talent-pools/:id/candidates` | Add to pool |
| `DELETE` | `/recruiter/talent-pools/:id/candidates/:candidateId` | Remove from pool |

## Pipeline Stages

The default candidate pipeline stages are:

1. **New** — Application just received
2. **Review** — Under initial review
3. **Shortlisted** — Passed initial screening
4. **Recruiter Screen** — Phone/video screen with recruiter
5. **Interview** — Technical/team interview
6. **Final Interview** — Final round with hiring manager
7. **Offer** — Offer stage
8. **Hired** — Offer accepted
9. **Rejected** — Application rejected
10. **Withdrawn** — Candidate withdrew

Organizations can customize stages via `candidate_pipeline_stages` table.

## Security & Privacy

### Company Isolation
- All data queries are scoped to `org_id` from the recruiter's profile
- `VerifyRecruiterOrgAccess()` validates recruiter belongs to the organization
- Cross-company data access is prevented at the repository layer

### RBAC Roles
| Role | Permissions |
|------|------------|
| **Organization Owner** | Full access to all ATS features |
| **Recruiter Admin** | Manage jobs, applications, team, templates |
| **Hiring Manager** | View/manage own department's jobs and applications |
| **Recruiter** | View/manage assigned jobs and applications |
| **Interviewer** | Submit interview feedback, view candidate profiles |
| **Viewer** | Read-only access to jobs and pipeline |

### Privacy Audit Trail
Every candidate data access is logged to `candidate_access_logs`:
- Candidate viewed, resume viewed/downloaded
- Stage changed, note created, evaluation created
- Offer created/updated, interview scheduled
- Bulk actions performed

### IDOR Protection
- All endpoints verify the requesting user's org membership
- Application/pipeline access validates org ownership of the parent job
- Candidate notes are scoped to org_id (Company A cannot see Company B's notes)

## Candidate Evaluation Scoring

Evaluations use a 0-10 scale across these dimensions:

| Dimension | Description |
|-----------|-------------|
| Skills Score | Technical skills match |
| Experience Score | Years and relevance of experience |
| Communication Score | Written and verbal communication |
| Technical Score | Technical assessment performance |
| Culture Fit Score | Alignment with company culture |
| Role Fit Score | Suitability for the specific role |
| Overall Score | Holistic evaluation |

Recommendations: `Strong Hire`, `Hire`, `Consider`, `Maybe`, `Reject`

## Troubleshooting

### Common Issues

| Issue | Resolution |
|-------|-----------|
| Empty pipeline board | Ensure jobs exist and candidates have applied |
| 403 on application detail | Verify recruiter belongs to the job's organization |
| Notes not visible | Notes are org-scoped — switch to the correct org context |
| Stage history empty | History is recorded only when stages are changed via the API |
| Analytics showing zeros | Analytics aggregate from real data — verify applications exist |

### Development Mode (nil DB)
When running without a database connection (`db == nil`), the repository returns realistic fallback data for all queries. This enables frontend development without PostgreSQL.
