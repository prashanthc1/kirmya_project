# Kirmya Complete Repository Inventory & Module Catalog

## 1. System Applications & Core Modules
| Module Name | Backend Layer (`backend/internal/`) | Frontend Feature (`frontend/src/`) | Persistent Tables | OpenSearch Indices |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Users** | `auth/`, `user/` | `features/auth/` | `users`, `auth_credentials` | `kirmya_users` |
| **Profiles & Resumes** | `profile/`, `resume/` | `features/profile/` | `profiles`, `resumes` | `kirmya_profiles` |
| **Jobs & Applications** | `jobs/`, `applications/` | `features/jobs/` | `jobs`, `job_applications` | `kirmya_jobs` |
| **Recruiter & Organizations**| `recruiter/`, `organization/`| `features/recruiter/` | `organizations`, `recruiters` | `kirmya_orgs` |
| **Communities & Groups** | `community/` | `features/community/` | `communities`, `community_posts` | `kirmya_communities`|
| **Messaging & Interviews** | `messaging/`, `interview/` | `features/messaging/` | `messages`, `interviews` | - |
| **Learning & Skills** | `learning/`, `skills/` | `features/learning/` | `courses`, `skills` | `kirmya_learning` |
| **AI Career Intelligence** | `ai/`, `career_copilot/` | `features/ai/` | `ai_conversations` | - |
| **Notifications** | `notification/` | `features/notifications/` | `notifications`, `user_preferences` | - |
| **Search & Discovery** | `search/` | `features/search/` | Full-text triggers / views | Multi-Index Routing |
| **Analytics & BI** | `analytics/` | `features/analytics/` | `analytics_events`, `aggregates` | - |
| **Admin & Platform Ops** | `admin/`, `trust_safety/` | `features/admin/` | `audit_logs`, `incidents`, `flags` | - |
