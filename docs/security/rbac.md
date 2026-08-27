# Kirmya Role-Based Access Control (RBAC) Architecture

## 1. Role Hierarchy & Permission Scope

```
                                  Super Admin
                                       │
                                       ▼
                             Platform Administrator
                                       │
                                       ▼
                           Trust & Safety Moderator
                                       │
                                       ▼
                              Organization Admin
                                       │
                                       ▼
                             Recruiter / Org Member
                                       │
                                       ▼
                            Registered Standard User
                                       │
                                       ▼
                               Unauthenticated Guest
```

---

## 2. Centralized Permission Matrix

| Role | Scope | Key Permissions |
| :--- | :--- | :--- |
| **Guest** | Public Data Only | `job:read_public`, `community:read_public`, `profile:read_public` |
| **User** | Self + Public | `job:apply`, `job:save`, `community:join`, `profile:update_self`, `message:send` |
| **Recruiter** | Org-Scoped | `job:create`, `job:update`, `job:close`, `applicant:view`, `applicant:shortlist` |
| **Org Admin** | Tenant-Scoped | `org:manage`, `org:invite_member`, `org:remove_member`, `billing:view` |
| **Moderator** | Platform Safety | `content:moderate`, `report:review`, `user:warn`, `user:temporary_restrict` |
| **Super Admin**| Platform Operations | `admin:system_config`, `admin:role_assign`, `admin:break_glass_access` |
