# Kirmya PostgreSQL Database Inventory & Schema Specifications

## 1. Relational Entities & Indexing Map
| Table Name | Primary Key | Foreign Keys | Key Indexes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `id (UUID)` | - | `idx_users_email_unique` | Authoritative user account identity |
| `profiles` | `id (UUID)` | `user_id -> users(id)` | `idx_profiles_user_id` | Candidate professional profile |
| `jobs` | `id (UUID)` | `organization_id -> orgs(id)` | `idx_jobs_org_status`, `idx_jobs_tsvector` | Job postings and status |
| `job_applications` | `id (UUID)` | `job_id`, `candidate_id` | `idx_app_job_candidate_unique` | Candidate job applications |
| `notifications` | `id (UUID)` | `user_id -> users(id)` | `idx_notif_user_unread` | User in-app notification center |
| `audit_logs` | `id (UUID)` | `actor_id -> users(id)` | `idx_audit_actor_timestamp` | Immutable administrative audit trails |
