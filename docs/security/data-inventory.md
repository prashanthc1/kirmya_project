# Kirmya Security & Privacy Sensitive Data Inventory

## Data Classification & Access Policy

| Category | Entities / Fields | Storage Location | Encryption Standard | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Auth & Identity** | Passwords, TOTP Secrets, Refresh Tokens | PostgreSQL `users` | Bcrypt (Cost 12), AES-256 GCM | System Internal Only |
| **Candidate PII** | Full Name, Email, Resume, Location | PostgreSQL / S3 | TLS 1.3 in transit, S3-SSE | Candidate & Hiring Recruiter |
| **Recruiter Data** | Org Notes, Candidate Ratings | PostgreSQL `application_notes` | AES-256 at Rest | Hiring Recruiters Only |
| **Audit Logs** | IP Address, User Agent, Security Events | PostgreSQL `security_events` | Append-only DB | Security Admins & SOC |
