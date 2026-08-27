# Kirmya Automated Data Retention Policies & Purge Schedules

## 1. Data Retention Timetable

| Category | Retention Duration | Purge Mechanism | Compliance Justification |
| :--- | :--- | :--- | :--- |
| **Active User Profiles** | Lifetime of account | Manual deletion | User Consent |
| **Deleted Accounts** | 30 days | Automated Hard Delete Worker | Grace Period / GDPR Right to Erasure |
| **Raw Analytics Events** | 90 days | Partition Drop Worker | Data Minimization |
| **Notification Logs** | 180 days | Partition Rollup Worker | Operational History |
| **Security Audit Logs** | 365 days | Append-Only Archive | Compliance & Forensic Auditing |
