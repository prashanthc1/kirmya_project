# Kirmya Data Classification & Handling Matrix

## Data Sensitivity Tiers

| Classification Level | Definition & Examples | Storage & Encryption Standard | Access Controls & Masking |
| :--- | :--- | :--- | :--- |
| **Public** | Published jobs, public communities, public profiles, skills taxonomy | Standard PostgreSQL table, cached in OpenSearch/CDN | Openly accessible via GET APIs |
| **Internal** | Non-sensitive aggregate metrics, system settings, category tags | Standard PostgreSQL table | Restricted to application services |
| **Private** | Email addresses, phone numbers, resume attachments, application state | Encrypted in transit (TLS 1.3), AES-256 at rest | User self-access; RBAC masked for admins |
| **Sensitive** | Login history, IP addresses, MFA TOTP secrets, security audit logs | Column-level encryption or secure hash | DSR export sanitization; zero plain logging |
| **Highly Sensitive** | Bcrypt/Argon2id password hashes, JWT private keys, backup vault keys | KMS-managed keys, secret store vault | Never returned in APIs or user data exports |
