# Kirmya Data Retention & Scheduled Lifecycle Policies

## 1. Retention Matrix by Data Domain

| Data Domain | Active Retention | Post-Account Deletion Retention | Purge Mechanism |
| :--- | :--- | :--- | :--- |
| **User Identity & Profile** | Active Account Lifetime | 30-Day Grace Period -> Hard Delete | Background Worker |
| **Resumes & Documents** | Up to 5 Active Files | 30-Day Grace Period -> S3 Purge | S3 Object Deletion |
| **Notifications** | 90 Days | Immediate Purge | Daily Retention Cron |
| **Audit Logs** | 365 Days | 365 Days (Anonymized User ID) | Immutability Table |
