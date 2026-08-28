# Kirmya Personally Identifiable Information (PII) Data Inventory

## 1. PII Catalog & Sensitivity Classification
| Data Category | Specific Elements | Classification | Storage Location | Encryption at Rest | Retention Window |
| :--- | :--- | :--- | :--- | :---: | :--- |
| Identity & Auth | Full Name, Email, Password Hash, MFA Secret | Confidential | PostgreSQL `users`, `auth_credentials` | AES-256-GCM | Lifetime of Account |
| Professional Profile | Headline, Work History, Education, Skills, Bio | Public / Discoverable | PostgreSQL `profiles`, OpenSearch `kirmya_users` | AES-256-GCM | Lifetime of Account |
| Resumes & CVs | PDF/Docx files, Parsed Career Records | Confidential | Encrypted Object Store / S3, PostgreSQL | AES-256-GCM | User Controlled |
| Applications | Cover Letters, Interview Answers, Status | Confidential | PostgreSQL `job_applications` | AES-256-GCM | 3 Years Post-Closure |
| Security Logs | IP Address, User Agent, Session Tokens | Internal | PostgreSQL `security_events`, `audit_logs` | AES-256-GCM | 90 Days (Purged) |
