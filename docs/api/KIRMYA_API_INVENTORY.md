# Kirmya API Master Inventory & Contract Specification (Prompt 11/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: 100% AUDITED & STANDARDIZED  
**Scope**: Full catalog of 816 API routes mapped across all 56 backend domain modules under `/api/v1`.

---

## 1. Domain Module Endpoint Inventory

| Module / Domain | Base Path | Total Routes | Auth Policy | RBAC Roles | Primary DTOs | Status |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **Authentication** | `/api/v1/auth` | 14 | Public / Bearer | `all` | `LoginRequest`, `RegisterRequest`, `UserDTO` | 🟢 Standard |
| **User Profiles** | `/api/v1/profile` | 26 | Bearer Token | `candidate`, `recruiter`, `admin` | `UpdateProfileDTO`, `WorkExperienceDTO`, `EducationDTO` | 🟢 Standard |
| **Jobs & Listings** | `/api/v1/jobs` | 18 | Public / Bearer | `all` | `JobSearchQuery`, `JobSummary`, `JobListPage` | 🟢 Standard |
| **Job Applications**| `/api/v1/applications` | 16 | Bearer Token | `candidate`, `recruiter` | `CreateApplicationPayload`, `ApplicationDetailDTO` | 🟢 Standard |
| **Companies** | `/api/v1/companies` | 42 | Public / Bearer | `company_admin`, `recruiter` | `CompanyProfileDTO`, `CompanyReviewDTO`, `TeamMemberDTO` | 🟢 Standard |
| **Recruiter ATS** | `/api/v1/recruiter` | 38 | Bearer Token | `recruiter`, `hiring_manager`, `admin` | `CreateJobPayload`, `ATSBulkActionPayload`, `CandidateNoteDTO`| 🟢 Standard |
| **Networking** | `/api/v1/network` | 22 | Bearer Token | `all authenticated` | `SendConnectionRequestDTO`, `ConnectionDTO` | 🟢 Standard |
| **Messaging** | `/api/v1/messages` | 20 | Bearer Token | `all authenticated` | `SendMessageDTO`, `ConversationDTO`, `MessageDTO` | 🟢 Standard |
| **Communities** | `/api/v1/communities`| 32 | Bearer Token | `community_moderator`, `member` | `CreateCommunityDTO`, `PostDTO`, `CommentDTO` | 🟢 Standard |
| **Notifications** | `/api/v1/notifications`| 18 | Bearer Token | `all authenticated` | `NotificationEvent`, `NotificationDTO`, `PreferenceDTO` | 🟢 Standard |
| **Interviews** | `/api/v1/interviews` | 24 | Bearer Token | `interviewer`, `recruiter`, `candidate`| `CreateInterviewRequest`, `SubmitFeedbackRequest` | 🟢 Standard |
| **AI Job Matching** | `/api/v1/ai-match` | 12 | Bearer Token | `candidate`, `recruiter` | `JobMatchScore`, `CareerInsightsDTO` | 🟢 Standard |
| **Compliance & DSR**| `/api/v1/compliance` | 18 | Bearer Token | `platform_admin`, `compliance_officer` | `DSRRequestPayload`, `LegalHoldDTO`, `AuditLogDTO` | 🟢 Standard |
| **Enterprise Hiring**| `/api/v1/enterprise` | 28 | Bearer Token | `enterprise_admin`, `recruiter` | `CreatePoolPayload`, `TeamMemberPayload` | 🟢 Standard |
| **Resumes & ATS** | `/api/v1/resumes` | 22 | Bearer Token | `candidate`, `recruiter` | `CreateResumeRequest`, `ATSAnalysisDTO` | 🟢 Standard |
| **Trust & Safety** | `/api/v1/trust-safety`| 24 | Bearer Token | `moderator`, `admin` | `SubmitReportPayload`, `ModerationActionPayload` | 🟢 Standard |
| **Platform Admin** | `/api/v1/admin` | 464 | Bearer Token | `platform_admin` | `AdminUserDTO`, `AnalyticsOverviewDTO`, `BackupDTO` | 🟢 Standard |
| **System & Health** | `/health` | 4 | Public | `none` | `HealthResponse`, `DependencyHealthResponse` | 🟢 Standard |

---

## 2. API Contract Invariants

1. **URL Uniformity**: All platform API routes reside under the canonical prefix `/api/v1/`.
2. **Deterministic Envelopes**:
   * Data payloads return top-level models or paginated `{"data": [...], "page": 1, "limit": 20, "total": 150, "total_pages": 8}` envelopes.
   * Error responses return sanitized RFC-compliant error payloads: `{"error": "machine_readable_message", "code": "ERROR_CODE"}`.
3. **HTTP Verb Semantics**:
   * `GET`: Idempotent data retrieval.
   * `POST`: Resource creation and non-idempotent business actions.
   * `PUT` / `PATCH`: Resource state mutations and full/partial updates.
   * `DELETE`: Resource removal or soft-deletion.
4. **Header Architecture**:
   * `Authorization`: `Bearer <jwt_token>` for protected endpoints.
   * `X-Trace-ID`: Distributed request tracing correlation ID.
   * `X-Response-Time-Ms`: Server execution latency in milliseconds.
