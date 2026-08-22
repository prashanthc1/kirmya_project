# Kirmya Data Domains & System Ownership

## Data Domain Definitions

| Domain Name | Domain Owner | Primary Tables | Primary APIs | Secondary Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **Identity & Auth** | Security Engineering | `users`, `auth_credentials`, `sessions`, `mfa_secrets` | `/api/v1/auth/*`, `/api/v1/security/*` | Redis Session Store |
| **User Profile & Skills** | Core Platform Team | `profiles`, `user_experiences`, `user_educations`, `user_skills` | `/api/v1/profile/*` | OpenSearch Profile Index |
| **Jobs & Applications** | Recruitment Team | `jobs`, `applications`, `saved_jobs`, `job_alerts` | `/api/v1/jobs/*`, `/api/v1/applications/*` | OpenSearch Job Index |
| **Networking & Messages** | Social Features Team | `connections`, `conversations`, `messages` | `/api/v1/network/*`, `/api/v1/messages/*` | NATS Event Bus |
| **Communities & Groups** | Community Ops | `communities`, `community_members`, `community_posts` | `/api/v1/communities/*` | OpenSearch Community Index |
| **Notifications & Digest**| Communication Ops | `notifications`, `notification_preferences`, `notification_digests` | `/api/v1/notifications/*` | Redis Delivery Buffer |
| **Privacy & Governance** | Data Governance | `data_requests`, `legal_holds`, `retention_policies` | `/api/v1/privacy/*`, `/api/v1/admin/compliance/*` | Audit Log Service |
