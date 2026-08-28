# Kirmya End-to-End System Integration & Cross-Module Verification Guide

## 1. System Integration Map & Data Flow

```
[Candidate / Recruiter Web Client]
               │ (Next.js / TypeScript / MUI v6)
               ▼
[API Gateway & Router] ────► [Auth & JWT Context]
               │
   ┌───────────┼───────────┬───────────┬───────────┐
   ▼           ▼           ▼           ▼           ▼
[Profile]   [Jobs/ATS]  [Network]   [Messages]  [Admin/DSR]
   │           │           │           │           │
   └───────────┴───────────┼───────────┴───────────┘
                           ▼
            [PostgreSQL Primary Store]
            (Normalized 3NF / pgxpool)
```

---

## 2. Verified End-to-End User Journeys

### 2.1 Complete Candidate Career Journey
1. **Signup & Identity**: Candidate registers $\rightarrow$ `POST /api/v1/auth/register` $\rightarrow$ Verification token issued $\rightarrow$ `POST /api/v1/auth/login`.
2. **Profile Completion**: Candidate adds skills & experience $\rightarrow$ `PUT /api/v1/profile` $\rightarrow$ Profile score calculated $\rightarrow$ Indexed in search.
3. **Job Search & Application**: Candidate searches roles $\rightarrow$ `GET /api/v1/jobs/search` $\rightarrow$ Submits ATS application $\rightarrow$ `POST /api/v1/applications`.
4. **Recruiter Pipeline**: Recruiter views application $\rightarrow$ Updates stage $\rightarrow$ `reviewed` $\rightarrow$ `interview` $\rightarrow$ Multi-channel notification sent.
5. **Real-Time Communication**: Recruiter initiates chat $\rightarrow$ Messages broadcast via WebSocket hub (`GET /api/v1/messages/ws`).

### 2.2 Complete Organization & Recruiter Journey
1. **Org Setup**: Recruiter onboarded $\rightarrow$ Organization profile created $\rightarrow$ RBAC roles assigned.
2. **Job Publishing**: Recruiter publishes job listing $\rightarrow$ OpenSearch & PostgreSQL trigram index updated.
3. **Candidate Management**: Recruiter reviews scorecards $\rightarrow$ Adds private notes $\rightarrow$ Progresses candidate to hire.

---

## 3. Cross-Module Invariants & Security Boundaries

- **Zero Cross-Tenant Leakage**: Recruiter scorecards and candidate pipelines enforce `organization_id` isolation.
- **Strict Context Identity**: All mutations derive user identity from authenticated JWT context (`c.Get("userID")`), eliminating IDOR vulnerabilities.
- **Transactional Consistency**: Multi-step state transitions execute inside PostgreSQL transactions with automatic rollback safety.
