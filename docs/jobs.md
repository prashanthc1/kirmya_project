# Kirmya Jobs, Applications & Career Opportunity Platform

## 1. Architecture & Domain Overview

The Kirmya Job Market, ATS & Career Opportunity system provides a unified pipeline for job discovery, algorithmic/AI matching, application lifecycle management, and recruiter hiring workflows.

```
Candidate / Job Seeker                   Recruiter / Hiring Team
        │                                         │
        ├──────────────────────────┐              ├──────────────────────────┐
        ▼                          ▼              ▼                          ▼
Public Job Search          Saved Jobs & Alerts   Job Posting & Pipeline   Scorecards & Evaluation
(/api/v1/jobs)             (/api/v1/jobs/saved)  (/api/v1/recruiter/jobs) (/api/v1/recruiter/eval)
        │                                         │
        ▼                                         ▼
Application Submission ───────────────────► Application Tracking System
(/api/v1/applications)                      (Kanban Stages & Status Transitions)
```

---

## 2. Job Lifecycle & State Machine

```
   [ Draft ]
       │
       ▼
 [ Published ] ──► [ Active ] ──► [ Closed / Expired ] ──► [ Archived / Deleted ]
```

1. **Draft**: Private to employer/recruiter; not visible in public search queries.
2. **Published / Active**: Publicly indexed, searchable, accepting new applications.
3. **Closed / Expired**: Inactive on the job board; rejects new applications; existing applications remain accessible for review.
4. **Archived / Deleted**: Excluded from normal search indexes; retained for compliance and analytics.

---

## 3. Application State Transitions

```
[ Applied ] ──► [ In Review ] ──► [ Interview Scheduled ] ──► [ Offered ] ──► [ Hired ]
     │                │                    │
     ▼                ▼                    ▼
[ Withdrawn ]   [ Rejected ]          [ Rejected ]
```

- **Candidate Actions**: Candidates can withdraw their application at any time prior to offer acceptance.
- **Recruiter Actions**: Authorized recruiters can advance candidates through stages (`In Review`, `Screening`, `Interview`, `Assessment`, `Offer`, `Hired`, `Rejected`).

---

## 4. REST API Endpoint Directory

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/jobs` | Public job board search with faceted filters and pagination | Public |
| `GET` | `/api/v1/jobs/saved` | List candidate's saved job bookmarks | Bearer Token (Candidate) |
| `POST` | `/api/v1/jobs/:id/save` | Save / bookmark a job posting | Bearer Token (Candidate) |
| `DELETE`| `/api/v1/jobs/:id/save` | Remove saved job bookmark | Bearer Token (Candidate) |
| `GET` | `/api/v1/jobs/matches` | Algorithmic and AI candidate-job matching recommendations | Bearer Token (Candidate) |
| `POST` | `/api/v1/jobs/matches/:id/feedback` | Submit relevance feedback on AI job match | Bearer Token (Candidate) |
| `GET` | `/api/v1/job-alerts` | List candidate's active job search alerts | Bearer Token (Candidate) |
| `POST` | `/api/v1/job-alerts` | Create automated daily/weekly job alert | Bearer Token (Candidate) |
| `DELETE`| `/api/v1/job-alerts/:id`| Delete job alert | Bearer Token (Candidate) |
| `GET` | `/api/v1/applications` | Candidate application tracking list with status filters | Bearer Token (Candidate) |
| `GET` | `/api/v1/applications/:id` | View specific application status and interview steps | Bearer Token (Owner/Recruiter) |
| `PUT` | `/api/v1/applications/:id/withdraw` | Withdraw candidate application | Bearer Token (Owner) |
| `GET` | `/api/v1/applications/:id/timeline` | Candidate hiring status timeline events | Bearer Token (Owner/Recruiter) |
| `GET` | `/api/v1/interviews` | List upcoming scheduled candidate interviews | Bearer Token (Candidate) |
| `GET` | `/api/v1/documents` | Candidate attached resumes and portfolios | Bearer Token (Candidate) |
| `POST` | `/api/v1/documents/upload` | Upload resume or credential document | Bearer Token (Candidate) |
| `DELETE`| `/api/v1/documents/:id` | Remove candidate document | Bearer Token (Candidate) |
| `POST` | `/api/v1/recruiter/jobs` | Create and publish a job posting | Recruiter / Employer RBAC |
| `PUT` | `/api/v1/recruiter/jobs/:id` | Edit active job requirements | Recruiter / Employer RBAC |
| `POST` | `/api/v1/recruiter/jobs/:id/close` | Close or expire job posting | Recruiter / Employer RBAC |
| `GET` | `/api/v1/recruiter/pipeline` | Recruiter Kanban candidate pipeline | Recruiter / Employer RBAC |
| `POST` | `/api/v1/recruiter/applications/:id/stage` | Move candidate to pipeline stage | Recruiter / Employer RBAC |
| `POST` | `/api/v1/recruiter/applications/:id/evaluate` | Submit scorecard evaluation | Recruiter / Employer RBAC |

---

## 5. Security & Authorization Controls

1. **Server-Authoritative Identity**: The candidate's `userID` is extracted directly from the verified JWT token context (`c.Get("userID")`), eliminating IDOR/BOLA tampering.
2. **Organization Tenant Scoping**: Recruiter endpoints strictly filter all candidate, job, and team operations by `WHERE organization_id = $1`.
3. **Idempotency & Duplicate Prevention**: Applications enforce uniqueness constraints on `(candidate_id, job_id)` to prevent accidental double-submissions.
4. **Parameterized SQL Queries**: All search filters and sorting parameters are validated against strict allowlists and bound using parameterized SQL placeholders (`$1, $2, ...`) via `pgxpool`.
