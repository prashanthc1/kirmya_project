# Kirmya Job Applications & Candidate Lifecycle Architecture Guide

## 1. Architectural Overview & Workflow

```
[Candidate Job Seeker]                           [Recruiter & Hiring Team]
          │                                                  │
          ├──────────────────────────┐                       ├──────────────────────────┐
          ▼                          ▼                       ▼                          ▼
   Submit Application       View Status & Timeline    Kanban Pipeline Stages    Scorecards & Notes
(/api/v1/applications)    (/api/v1/applications/:id) (/api/v1/recruiter/pipe)  (/api/v1/recruiter/eval)
          │                          │                       │                          │
          └──────────────────────────┴───────────┬───────────┴──────────────────────────┘
                                                 ▼
                                  [PostgreSQL Primary Store]
                               (Composite Uniqueness & Atomicity)
```

---

## 2. Application State Transitions & Lifecycle

```
[ Applied ] ──► [ In Review ] ──► [ Interview Scheduled ] ──► [ Offered ] ──► [ Hired ]
     │                │                    │
     ▼                ▼                    ▼
[ Withdrawn ]   [ Rejected ]          [ Rejected ]
```

### 2.1 State Rules
1. **Applied / Submitted**: Initial state upon successful candidate submission.
2. **In Review**: Recruiter is actively screening resume and qualifications.
3. **Interview Scheduled**: Candidate invited for technical or behavioral interview.
4. **Offered / Hired**: Candidate presented with job offer or successfully hired.
5. **Withdrawn**: Candidate elected to withdraw their application.
6. **Rejected**: Hiring team declined the application at any stage.

---

## 3. Candidate & Recruiter Authorization Matrix

| Action | Candidate (Owner) | Candidate (Other) | Recruiter (Org) | Recruiter (Other Org) | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Submit Application** | Yes | No | No | No | No |
| **View Application** | Yes | No (`403`) | Yes | No (`403`) | Yes |
| **Download Resume** | Yes | No (`403`) | Yes | No (`403`) | Yes |
| **Withdraw Application**| Yes | No (`403`) | No | No | Yes |
| **Advance Pipeline** | No (`403`) | No (`403`) | Yes | No (`403`) | Yes |
| **Add Internal Notes** | No (`403`) | No (`403`) | Yes | No (`403`) | Yes |
| **Scorecard Evaluation**| No (`403`) | No (`403`) | Yes | No (`403`) | Yes |

---

## 4. Document Security & Access Rules

- **Signed Download URLs**: Resume attachments and portfolios generate temporary signed URLs with 15-minute expiration.
- **Strict Tenant & Identity Scoping**: Resumes can only be fetched by the candidate who uploaded them or authorized recruiters for the specific job.
