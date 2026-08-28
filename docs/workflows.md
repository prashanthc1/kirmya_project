# Kirmya End-to-End Business Workflows & Cross-Module Integration Guide

## 1. System-Wide Module Dependency Map

Kirmya's cross-module interactions follow strict hierarchical dependency flows, coordinating domain services without circular dependencies.

```
                  ┌─────────────────────────────────┐
                  │       Identity & Auth (Root)    │
                  └───────────────┬─────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Candidate Profile│     │ Recruiter & Org │      │ Compliance/Admin│
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         ├────────────────────────┴──────────┬─────────────┤
         ▼                                   ▼             ▼
┌─────────────────┐                 ┌─────────────────┐ ┌─────────────┐
│ Jobs & ATS      │                 │ Networking &    │ │ Messaging & │
│ Applications    │                 │ Communities     │ │ Notification│
└─────────────────┘                 └─────────────────┘ └─────────────┘
```

---

## 2. Core Business Lifecycle Workflows

### 2.1 Authentication & Onboarding Journey
1. Candidate/Recruiter registers with email & password $\rightarrow$ `POST /api/v1/auth/register`.
2. Verification token generated and emailed (or returned in response when SMTP is unconfigured).
3. Candidate logs in $\rightarrow$ `POST /api/v1/auth/login` (JWT Bearer + Refresh Cookie issued).
4. Candidate completes profile $\rightarrow$ `PUT /api/v1/profile` (Skills, Experience, Education added).
5. Profile completeness score dynamically computed $\rightarrow$ candidate indexed for discovery.

### 2.2 Job Market & Application ATS Pipeline
1. Recruiter creates verified job listing $\rightarrow$ `POST /api/v1/jobs` (State: `published`).
2. Candidate searches and matches role $\rightarrow$ `GET /api/v1/jobs/match` (Explainable fit factors).
3. Candidate applies $\rightarrow$ `POST /api/v1/applications` (Duplicate applications rejected).
4. Multi-channel notification dispatched to Recruiter $\rightarrow$ In-App / Email / Push.
5. Recruiter progresses candidate $\rightarrow$ `submitted` $\rightarrow$ `reviewed` $\rightarrow$ `interview` $\rightarrow$ `hired`.

### 2.3 Networking & Real-Time Communication
1. User searches professional peer $\rightarrow$ `GET /api/v1/network/people/search`.
2. User sends connection request $\rightarrow$ `POST /api/v1/network/requests`.
3. Peer accepts $\rightarrow$ `POST /api/v1/network/requests/:id/accept` (Mutual graph updated).
4. Direct chat initiated $\rightarrow$ `POST /api/v1/messages/conversations`.
5. Messages streamed in real-time via WebSocket hub (`GET /api/v1/messages/ws`).

### 2.4 Data Governance & User Rights (DSR)
1. User requests full data export $\rightarrow$ `POST /api/v1/compliance/dsr/export`.
2. Backend packages profile, resume, application, and messaging archives (excluding secrets/hashes).
3. User requests account deletion $\rightarrow$ `POST /api/v1/compliance/account/delete`.
4. Deletion checks active `legal_holds`; if clear, user PII is cascaded and purged.

---

## 3. Transaction & Invariant Safeguards

- **Atomic State Transitions**: Multi-step state transitions execute inside PostgreSQL transactions or mutex-protected fallback locks.
- **Race Prevention**: Composite unique keys prevent simultaneous duplicate applications, double connection requests, and duplicate webhook ingestion.
- **Graceful Offline Degradation**: Optional dependencies (Redis, NATS, OpenSearch, AI) degrade seamlessly to PostgreSQL fallbacks without data corruption.
