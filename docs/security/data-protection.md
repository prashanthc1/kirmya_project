# Kirmya Data Protection, Encryption & Sensitive Field Masking

## 1. Cryptographic Standards
- **In-Transit**: TLS 1.3 encryption with strict cipher suites.
- **At-Rest**: PostgreSQL tablespace encryption and AES-256 S3 bucket encryption.
- **Password Hashes**: Bcrypt with cost factor 12.
- **MFA Secrets**: Encrypted TOTP secrets with dedicated encryption key.

---

## 2. PII Log Redaction Engine
Structured logging interceptors automatically scrub Authorization headers, session cookies, password inputs, and resume text snippets.
