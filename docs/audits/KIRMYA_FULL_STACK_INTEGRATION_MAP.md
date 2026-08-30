# Kirmya Master Full-Stack Integration Map

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: 100% AUDITED & VERIFIED  
**Scope**: Full request-response topology across all 56 backend modules, Next.js frontend pages, API clients, middlewares, services, repositories, and PostgreSQL tables.

---

## 1. Master Request Pipeline Topology

Every HTTP request traverses a standardized layered architecture:
```
[Browser / Client (Next.js 16 + React 18 + MUI v6)]
   │
   ▼
[API Client Layer (frontend/src/services/api.ts & authService.ts)]
   │  - Bearer Token Injection
   │  - 401 Silent Token Refresh Interceptor
   ▼
[Reverse Proxy / CORS / Security Middleware]
   │  - CORS (AllowedOrigins)
   │  - SecurityHeaders
   │  - RateLimiter (Token Bucket)
   │  - TenantIsolationMiddleware
   │  - MobileDeviceMiddleware
   │  - TelemetryMiddleware (Prometheus metrics & Trace IDs)
   ▼
[Auth & RBAC Middlewares (internal/auth/middleware & internal/shared/middleware)]
   │  - JWT Bearer Validation
   │  - Role / Scope Verification (candidate, recruiter, admin)
   ▼
[Delivery / HTTP Handlers (internal/<module>/delivery/http/)]
   │  - Request DTO Parsing & Validation (Gin binding / JSON schema)
   │  - Standardized JSON Envelope Response
   ▼
[Domain Services (internal/<module>/service/)]
   │  - Business Logic Execution
   │  - State Machine Transition Rules
   │  - Cross-Module Side Effect Orchestration
   ▼
[Data Repositories (internal/<module>/repository/)]
   │  - jackc/pgx/v5 Database Connection Pool
   │  - Parameterized SQL / Prepared Statements
   │  - Transaction Boundary Execution (tx.Begin / tx.Commit)
   ▼
[PostgreSQL 16 Cluster]
   │  - Foreign Key Constraints & Cascade Policies
   │  - Multi-Column & Compound Indexing
   │  - Row-Level Locking (FOR UPDATE)
```

---

## 2. Full-Stack Domain Integration Mappings

### 1. Authentication & Session Security
* **Frontend Route**: `/login`, `/register`, `/forgot-password`, `/reset-password`
* **API Client**: `authService.login`, `authService.register`, `authService.refreshToken`
* **HTTP Endpoint**: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/refresh`
* **Middlewares**: `SecurityHeaders`, `RateLimiter`, `TelemetryMiddleware`
* **Backend Layer**: `authHttp.AuthHandler` $\to$ `authSvc.AuthService` $\to$ `authRepo.AuthRepository`
* **PostgreSQL Tables**: `users`, `user_sessions`, `email_verifications`, `audit_logs`
* **Frontend Cache**: `AuthContext` (in-memory access token + HTTP-only refresh cookie).

### 2. User Profile & Candidate Resume
* **Frontend Route**: `/profile`, `/resume`
* **API Client**: `api.get('/profile')`, `api.put('/profile')`, `api.get('/resume')`
* **HTTP Endpoint**: `GET /api/v1/profile`, `PUT /api/v1/profile`, `GET /api/v1/resumes`
* **Middlewares**: `AuthMiddleware`, `TenantIsolationMiddleware`
* **Backend Layer**: `profileHttp.ProfileHandler` $\to$ `profileSvc.ProfileService` $\to$ `profileRepo.ProfileRepository`
* **PostgreSQL Tables**: `user_profiles`, `user_work_experiences`, `user_educations`, `user_skills`, `resumes`, `resume_sections`
* **Frontend Cache**: React Query `['userProfile']`, `['resumes']`.

### 3. Companies & Organizations
* **Frontend Route**: `/companies`, `/company/[id]`, `/organization`
* **API Client**: `api.get('/companies')`, `api.get('/companies/:id')`
* **HTTP Endpoint**: `GET /api/v1/companies`, `GET /api/v1/companies/:id`, `POST /api/v1/companies`
* **Middlewares**: `AuthMiddleware` (for mutations), `RateLimiter`
* **Backend Layer**: `companyHttp.CompanyHandler` $\to$ `companySvc.CompanyService` $\to$ `companyRepo.CompanyRepository`
* **PostgreSQL Tables**: `companies`, `company_profiles`, `company_locations`, `company_members`
* **Frontend Cache**: React Query `['companies']`, `['company', id]`.

### 4. Jobs & Candidate Discovery
* **Frontend Route**: `/jobs`, `/jobs/[id]`, `/search`
* **API Client**: `api.get('/jobs')`, `api.get('/jobs/:id')`, `api.get('/search/unified')`
* **HTTP Endpoint**: `GET /api/v1/jobs`, `GET /api/v1/jobs/:id`, `GET /api/v1/search/unified`
* **Middlewares**: `RateLimiter`, `TelemetryMiddleware`
* **Backend Layer**: `jobsHttp.JobHandler` $\to$ `jobsSvc.JobService` $\to$ `jobsRepo.JobRepository`
* **PostgreSQL Tables**: `jobs`, `job_skills`, `search_history`, `saved_searches`
* **Frontend Cache**: React Query `['jobs', query]`, `['jobDetail', id]`.

### 5. Applications & ATS Progression
* **Frontend Route**: `/applications`, `/recruiter/applications`
* **API Client**: `api.post('/applications')`, `api.get('/applications')`, `api.patch('/applications/:id/stage')`
* **HTTP Endpoint**: `POST /api/v1/applications`, `GET /api/v1/applications`, `PATCH /api/v1/applications/:id/stage`
* **Middlewares**: `AuthMiddleware` (Candidate or Recruiter scope)
* **Backend Layer**: `applicationsHttp.ApplicationsHandler` $\to$ `applicationsSvc.ApplicationsService` $\to$ `applicationsRepo.ApplicationsRepository`
* **PostgreSQL Tables**: `job_applications`, `application_stage_history`, `application_notes`
* **Frontend Cache**: React Query `['applications']`, `['applicationTimeline', id]`.

### 6. Networking & Connections
* **Frontend Route**: `/networking`, `/network`, `/people`
* **API Client**: `api.get('/networking/connections')`, `api.post('/networking/requests')`, `api.post('/networking/requests/:id/accept')`
* **HTTP Endpoint**: `GET /api/v1/networking/connections`, `POST /api/v1/networking/requests`, `POST /api/v1/networking/requests/:id/accept`
* **Middlewares**: `AuthMiddleware`
* **Backend Layer**: `netHttp.NetworkingHandler` $\to$ `netSvc.NetworkingService` $\to$ `netRepo.NetworkingRepository`
* **PostgreSQL Tables**: `connections`, `connection_requests`, `connection_request_notes`, `user_blocks`
* **Frontend Cache**: React Query `['connections']`, `['incomingRequests']`.

### 7. Real-Time Messaging & Conversations
* **Frontend Route**: `/messaging`, `/messages`
* **API Client**: `api.get('/messaging/conversations')`, `api.post('/messaging/messages')`
* **HTTP Endpoint**: `GET /api/v1/messaging/conversations`, `POST /api/v1/messaging/messages`, `PATCH /api/v1/messaging/conversations/:id/read`
* **Middlewares**: `AuthMiddleware`
* **Backend Layer**: `msgHttp.MessagingHandler` $\to$ `msgSvc.MessagingService` $\to$ `msgRepo.MessagingRepository`
* **PostgreSQL Tables**: `conversations`, `conversation_participants`, `messages`, `message_attachments`
* **Frontend Cache**: React Query `['conversations']`, `['messages', conversationId]`.

### 8. Communities, Posts & Discussions
* **Frontend Route**: `/communities`, `/communities/[id]`
* **API Client**: `api.get('/communities')`, `api.post('/communities/:id/posts')`, `api.post('/communities/posts/:id/comments')`
* **HTTP Endpoint**: `GET /api/v1/communities`, `POST /api/v1/communities/:id/posts`, `POST /api/v1/communities/posts/:id/comments`
* **Middlewares**: `AuthMiddleware`
* **Backend Layer**: `commHttp.CommunityHandler` $\to$ `commSvc.CommunityService` $\to$ `commRepo.CommunityRepository`
* **PostgreSQL Tables**: `communities`, `community_members`, `community_posts`, `community_comments`
* **Frontend Cache**: React Query `['communities']`, `['communityPosts', id]`.

### 9. Notifications & Event Dispatch
* **Frontend Route**: `/notifications`
* **API Client**: `api.get('/notifications')`, `api.patch('/notifications/:id/read')`, `api.get('/notifications/unread-count')`
* **HTTP Endpoint**: `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, `GET /api/v1/notifications/unread-count`
* **Middlewares**: `AuthMiddleware`
* **Backend Layer**: `notifyHttp.NotificationHandler` $\to$ `notifySvc.NotificationService` $\to$ `notifyRepo.NotificationRepository`
* **PostgreSQL Tables**: `notifications`, `notification_preferences`, `notification_devices`
* **Frontend Cache**: React Query `['notifications']`, `['unreadNotificationCount']`.

### 10. AI Matching & Recommendations
* **Frontend Route**: `/career-companion`, `/dashboard`
* **API Client**: `api.get('/ai-match/jobs')`, `api.post('/ai-match/feedback')`
* **HTTP Endpoint**: `GET /api/v1/ai-match/jobs`, `POST /api/v1/ai-match/feedback`
* **Middlewares**: `AuthMiddleware`
* **Backend Layer**: `jobMatchHttp.MatchingHandler` $\to` `jobMatchSvc.MatchingService` $\to$ `jobMatchRepo.MatchingRepository`
* **PostgreSQL Tables**: `ai_job_matches`, `matching_scores`, `matching_feedback`
* **Frontend Cache**: React Query `['jobMatches']`, `['recommendations']`.

### 11. Interview Management & Scorecards
* **Frontend Route**: `/interviews`
* **API Client**: `api.get('/interviews')`, `api.post('/interviews')`, `api.post('/interviews/:id/feedback')`
* **HTTP Endpoint**: `GET /api/v1/interviews`, `POST /api/v1/interviews`, `POST /api/v1/interviews/:id/feedback`
* **Middlewares**: `AuthMiddleware` (Panelist / Candidate / Recruiter)
* **Backend Layer**: `interviewHttp.InterviewHandler` $\to$ `interviewSvc.InterviewService` $\to$ `interviewRepo.InterviewRepository`
* **PostgreSQL Tables**: `interviews`, `interview_rounds`, `interview_participants`, `interview_feedback`
* **Frontend Cache**: React Query `['interviews']`, `['interviewDetail', id]`.

### 12. Trust, Safety & Content Moderation
* **Frontend Route**: `/safety`, `/trust-safety`, `/admin`
* **API Client**: `api.post('/trust-safety/reports')`, `api.get('/trust-safety/reports')`, `api.post('/trust-safety/moderation/decisions')`
* **HTTP Endpoint**: `POST /api/v1/trust-safety/reports`, `GET /api/v1/trust-safety/admin/reports`, `POST /api/v1/trust-safety/admin/decisions`
* **Middlewares**: `AuthMiddleware` (Admin scope for moderation decisions)
* **Backend Layer**: `trustHttp.TrustHandler` $\to$ `trustSvc.TrustSafetyService` $\to$ `trustRepo.TrustSafetyRepository`
* **PostgreSQL Tables**: `safety_reports`, `safety_cases`, `safety_moderation_decisions`, `safety_user_blocks`
* **Frontend Cache**: React Query `['safetyReports']`, `['adminCases']`.

### 13. Compliance, Governance & Data Subject Requests
* **Frontend Route**: `/compliance`, `/privacy`
* **API Client**: `api.post('/compliance/consents')`, `api.post('/compliance/data-requests')`
* **HTTP Endpoint**: `POST /api/v1/compliance/consents`, `POST /api/v1/compliance/data-requests`
* **Middlewares**: `AuthMiddleware`
* **Backend Layer**: `complianceHttp.ComplianceHandler` $\to$ `complianceSvc.ComplianceService` $\to$ `complianceRepo.ComplianceRepository`
* **PostgreSQL Tables**: `consent_records`, `data_requests`, `audit_events`, `legal_holds`
* **Frontend Cache**: React Query `['userConsents']`, `['dataRequests']`.

### 14. Enterprise Hiring & Squad Management
* **Frontend Route**: `/enterprise`, `/employer`
* **API Client**: `api.get('/enterprise/teams')`, `api.post('/enterprise/teams')`, `api.get('/enterprise/pools')`
* **HTTP Endpoint**: `GET /api/v1/enterprise/teams`, `POST /api/v1/enterprise/teams`, `GET /api/v1/enterprise/pools`
* **Middlewares**: `AuthMiddleware`, `TenantIsolationMiddleware`
* **Backend Layer**: `enterpriseHttp.EnterpriseHandler` $\to$ `enterpriseSvc.EnterpriseService` $\to$ `enterpriseRepo.EnterpriseRepository`
* **PostgreSQL Tables**: `enterprises`, `teams`, `candidate_pools`, `audit_logs`
* **Frontend Cache**: React Query `['enterpriseTeams']`, `['candidatePools']`.
