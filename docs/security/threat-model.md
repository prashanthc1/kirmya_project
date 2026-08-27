# Kirmya STRIDE Threat Model & Attack Surface Map

## 1. STRIDE Threat Analysis Matrix

| STRIDE Category | Target Asset | Threat Scenario | Implemented Mitigation |
| :--- | :--- | :--- | :--- |
| **Spoofing** | User / Recruiter Identity | Credential stuffing, session hijacking | TOTP MFA, Bcrypt cost 12, HttpOnly SameSite=Strict cookies |
| **Tampering** | Job Applications, Resumes | Malicious PDF payloads, parameter tampering | Magic byte verification, sandboxed UUID storage, schema validation |
| **Repudiation** | Privileged Admin Actions | Denial of suspension or role mutation | Immutable append-only audit logging with request/trace correlation |
| **Information Disclosure** | Candidate PII, Messages | IDOR parameter substitution (`/api/v1/applications/:id`) | Strict server-side ownership checks (`WHERE id = $1 AND owner_id = $2`) |
| **Denial of Service** | API Search, Authentication | High-frequency brute-force / query flooding | Redis distributed token bucket rate limiting (10 req/min for auth) |
| **Elevation of Privilege** | Normal User Role | Mass assignment of `role = "admin"` | Strict DTO binding ignoring protected metadata fields |
