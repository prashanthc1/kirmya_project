# Kirmya Security Test Matrix & Verification Suite

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: 100% PASSING  
**Suite**: `backend/test/security/security_hardening_test.go` and `backend/internal/shared/middleware/auth_test.go`

---

## 1. Automated Security Test Results

| Test ID | Test Category | Target Endpoint / Resource | Expected Security Result | Actual Result | Severity Class | Test Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **SEC-01** | JWT Validation | `GET /protected` with Expired Token | Rejected with `401 Unauthorized` | 401 Unauthorized | P1 | 🟢 PASS |
| **SEC-02** | JWT Integrity | `GET /protected` with Tampered Secret | Rejected with `401 Unauthorized` | 401 Unauthorized | P0 | 🟢 PASS |
| **SEC-03** | Auth Header Format | `GET /protected` with Malformed Header | Rejected with `401 Unauthorized` | 401 Unauthorized | P2 | 🟢 PASS |
| **SEC-04** | Valid JWT Token | `GET /protected` with Valid Bearer | Accepted with `200 OK` + claims | 200 OK | P3 | 🟢 PASS |
| **SEC-05** | Password Hashing | `bcrypt` Work Factor $\ge 12$ | Cost factor $\ge 12$ verified | Cost 12 verified | P1 | 🟢 PASS |
| **SEC-06** | Timing Attack Defense| `ComparePasswordSecurely` | Constant-time evaluation | Match / Mismatch verified | P2 | 🟢 PASS |
| **SEC-07** | Account State Check | `POST /api/v1/auth/login` (Locked) | Rejected with `403 Forbidden` | 403 Forbidden | P1 | 🟢 PASS |
| **SEC-08** | RBAC Admin Protection| `DELETE /api/v1/admin/users/:id` | Candidate rejected `403 Forbidden` | 403 Forbidden | P1 | 🟢 PASS |
| **SEC-09** | RBAC Role Privilege | `POST /api/v1/recruiter/jobs` | Candidate rejected `403 Forbidden` | 403 Forbidden | P1 | 🟢 PASS |
| **SEC-10** | RBAC Recruiter Access| `POST /api/v1/recruiter/jobs` | Recruiter accepted `201 Created` | 201 Created | P3 | 🟢 PASS |
| **SEC-11** | Clickjacking Defense | `X-Frame-Options` Header | Response contains `DENY` | `DENY` present | P2 | 🟢 PASS |
| **SEC-12** | MIME-Sniff Defense | `X-Content-Type-Options` Header | Response contains `nosniff` | `nosniff` present | P2 | 🟢 PASS |
| **SEC-13** | Transport Security | `Strict-Transport-Security` | HSTS `max-age=63072000` | HSTS present | P1 | 🟢 PASS |
| **SEC-14** | Content Security | `Content-Security-Policy` | Strict CSP policy returned | Strict CSP present | P2 | 🟢 PASS |
| **SEC-15** | Rate Limit Burst | `GET /rate-test` (Burst Exceeded) | 3rd request rejected with `429` | 429 Too Many Requests | P1 | 🟢 PASS |
| **SEC-16** | Rate Limit Header | `GET /rate-test` | `Retry-After` header populated | `Retry-After` present | P3 | 🟢 PASS |
| **SEC-17** | Path Traversal Defense| File Upload Storage Path | Server UUID path isolation | No `..` allowed | P1 | 🟢 PASS |
| **SEC-18** | SQL Injection Defense| Parameterized SQL Positional Args | Injection payload treated as literal| Query parameter safe | P0 | 🟢 PASS |
