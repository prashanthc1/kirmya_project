# Kirmya Authorization Model: Role-Based (RBAC) & Attribute-Based (ABAC)

## 1. Domain Permission Matrix

| Role | Scope | Key Capabilities | Boundary Enforcement |
| :--- | :--- | :--- | :--- |
| **Candidate User** | Personal Profile | Apply to jobs, track applications, post in groups, message connections | `WHERE user_id = caller_id` |
| **Recruiter** | Organization | Post jobs, review candidate pipeline, submit scorecards | `WHERE organization_id = caller_org_id` |
| **Community Moderator** | Group | Pin posts, lock discussions, remove spam comments | `WHERE community_id = caller_group_id` |
| **Trust & Safety Admin**| Platform | Review content reports, ban abusive accounts, resolve appeals | Dedicated Admin RBAC token validation |
| **Super Admin** | Platform Ops | Assign roles, configure system settings, access audit logs | Immutable audit log + MFA reauthentication |
