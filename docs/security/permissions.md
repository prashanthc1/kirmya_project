# Kirmya Centralized Permission Catalog (`resource:action`)

## 1. Catalog Standards
Permissions use standard `resource:action` formatting and are explicitly evaluated in the service layer or database query filters.

| Permission String | Description | Authorized Roles / Contexts |
| :--- | :--- | :--- |
| `profile:read` | View candidate profile | Public (Basic) / Recruiter (Full) / Owner |
| `profile:update` | Update profile attributes | Resource Owner Only |
| `job:create` | Post job opening | Verified Recruiter / Org Admin |
| `job:update` | Edit job details | Job Creator / Org Admin |
| `application:apply` | Submit job application | Job Seeker (Single Submission per Job) |
| `application:read` | View application details | Applicant Owner / Hiring Recruiter |
| `community:moderate` | Pin, lock, or delete post | Community Moderator / Admin |
| `message:send` | Send direct message | Conversation Participant |
| `admin:impersonate` | Initiate support session | Platform Support Admin (15m Expiring) |
| `admin:system_health` | Access OTEL & DB health | Platform Admin / Operations Admin |
