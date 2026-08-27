# Kirmya Secrets Management & Key Rotation Policy

## 1. Secrets Isolation & Management Rules
- **Zero Plaintext Secrets**: Passwords, API keys, database credentials, and JWT signing keys are stored exclusively in environment variables or external secret managers (HashiCorp Vault / AWS Secrets Manager).
- **No Git / Image Baking**: `.env` files, production keys, and TLS certificates are excluded via `.gitignore` and `.dockerignore`.
- **Public Environment Protection**: Next.js client environment variables (`NEXT_PUBLIC_*`) are restricted to non-sensitive frontend configuration.

---

## 2. Key Rotation Schedule

| Secret Category | Rotation Frequency | Emergency Rotation Trigger |
| :--- | :--- | :--- |
| **JWT Signing Keys** | Every 90 Days | Key exposure or session compromise |
| **Database Passwords** | Every 180 Days | Developer offboarding / breach alert |
| **S3 Access Keys** | Every 90 Days | Cloud credential leak alert |
| **MFA Encryption Keys** | Annual | Cryptographic standard deprecation |
