# Kirmya End-to-End Requirements Traceability Matrix

## 1. Traceability Matrix across Architecture Layers
| Platform Capability | Frontend Page / Component | Backend API Route | PostgreSQL Table | Unit & Integration Test |
| :--- | :--- | :--- | :--- | :--- |
| **User Sign-up & MFA** | `src/app/auth/page.tsx` | `POST /api/v1/auth/register` | `users`, `auth_credentials` | `internal/security/service_test.go` |
| **Profile & Portfolio** | `src/app/profile/page.tsx` | `PUT /api/v1/profile/me` | `profiles`, `profile_sections`| `internal/profile/service_test.go` |
| **Job Search & Filters**| `src/app/jobs/page.tsx` | `GET /api/v1/search/jobs` | `jobs`, TSVECTOR triggers | `internal/search/service_test.go` |
| **Application Pipeline**| `src/app/recruiter/pipeline/`| `GET /api/v1/recruiter/pipeline`| `job_applications` | `internal/recruiter/service_test.go` |
| **Community Feed** | `src/app/communities/[id]/` | `GET /api/v1/communities/:id/feed`| `community_posts` | `internal/community/service_test.go` |
| **Direct Messaging** | `src/app/messages/page.tsx`| `POST /api/v1/messages/send` | `messages`, `conversations` | `internal/messaging/service_test.go` |
| **Admin Incident Ops** | `src/app/admin/operations/`| `POST /api/v1/admin/incidents`| `incidents`, `audit_logs` | `internal/admin/service_test.go` |
