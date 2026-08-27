# Kirmya Server-Authoritative RBAC & ABAC Ownership Controls

## 1. Zero-Trust Resource Ownership Scoping
- Every endpoint accessing a user resource validates ownership at the database query layer (`WHERE id = $1 AND user_id = $2`).
- Recruiter actions verify organization membership token permissions before allowing applicant review or scorecard feedback submission.
- Platform Admin actions are partitioned across discrete roles (`Support Admin`, `Content Moderator`, `Trust & Safety Admin`, `Super Admin`).
