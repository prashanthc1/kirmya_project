# Kirmya PostgreSQL Schema Reference & Entity Relationships

## 1. Domain Table Classifications

| Domain Area | Primary Tables | Foreign Key Cascades | Primary Access Patterns |
| :--- | :--- | :--- | :--- |
| **Auth & Security** | `users`, `sessions`, `mfa_factors`, `audit_logs` | `ON DELETE CASCADE` | `WHERE id = $1`, `WHERE email = $1` |
| **Job Market & ATS** | `jobs`, `applications`, `interviews`, `scorecards` | `ON DELETE CASCADE` | `WHERE job_id = $1`, `WHERE user_id = $1` |
| **Communities** | `communities`, `community_members`, `discussions` | `ON DELETE CASCADE` | `WHERE community_id = $1` |
| **Networking & Chat**| `connections`, `conversations`, `messages` | `ON DELETE CASCADE` | `WHERE user_id_1 = $1 OR user_id_2 = $1` |
| **Notifications** | `notifications`, `notification_preferences` | `ON DELETE CASCADE` | `WHERE user_id = $1 AND is_read = false` |
