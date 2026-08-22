# Kirmya Email Verification & Token Security

## 1. Verification Token Protocol
- **Token Generation**: Cryptographically secure 256-bit random string generated via `crypto/rand`.
- **Hashed Token Storage**: PostgreSQL stores only `sha256(token)` to prevent token compromise if database read replicas are inspected.
- **Expiration**: Verification tokens expire 24 hours after issuance. Single-use enforcement marks token consumed upon validation.
