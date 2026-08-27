# Kirmya REST API Reference & Endpoint Catalog

## 1. Modular Endpoint Namespaces

| Namespace | Module | Key Endpoints | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth` | Authentication | `/register`, `/login`, `/verify-email`, `/reset-password` | Public / Session |
| `/api/v1/jobs` | Job Market | `/`, `/:id`, `/apply`, `/search` | Public (Read) / Auth (Write) |
| `/api/v1/applications` | ATS Candidate | `/`, `/:id`, `/:id/status`, `/:id/scorecards` | Authenticated Candidate / Recruiter |
| `/api/v1/communities` | Communities | `/`, `/:id`, `/:id/posts`, `/:id/join` | Public (Read) / Auth (Member) |
| `/api/v1/notifications`| Notifications | `/`, `/unread-count`, `/mark-all-read`, `/preferences` | Authenticated User |
| `/api/v1/admin` | Platform Admin | `/users`, `/jobs`, `/reports`, `/impersonate`, `/system` | Super Admin / Moderator RBAC |
