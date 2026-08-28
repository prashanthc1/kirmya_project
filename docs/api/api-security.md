# Kirmya API Security & Defensive Controls

## 1. Authentication & Session Defense

- **HMAC / RSA Signed JWTs**: Access tokens expire in 15 minutes. Refresh tokens are stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies with cryptographically secure tokens.
- **Immediate Revocation**: Session revocation writes session UUIDs to a Redis token blocklist, instantly invalidating stolen credentials across all API gateways.
- **Brute Force Defense**: Login endpoints trigger IP and account lockouts after 5 consecutive failures within a 5-minute rolling window.

---

## 2. Authorization & IDOR/BOLA Protection

- **Server-Authoritative Identity**: The calling user's identity is extracted exclusively from the cryptographically verified JWT payload (`c.Get("userID")`). Handlers never trust `userId` fields passed in request bodies or query parameters.
- **Strict Ownership Checks**: Resources (resumes, applications, notes, messages) perform explicit SQL ownership verification before executing updates or reads:
  ```sql
  SELECT id FROM resumes WHERE id = $1 AND user_id = $2;
  ```
- **Organization Tenant Scoping**: Recruiter endpoints strictly filter all candidate, job, and team operations by `WHERE organization_id = $1`.

---

## 3. Input Validation & Mass Assignment Defense

- **Explicit Request DTOs**: Database model structs are never bound directly from Gin requests. Handlers use dedicated DTO structs with Gin binding annotations (`binding:"required,max=100"`).
- **String Sanitization**: User-provided inputs are stripped of script tags and executable JavaScript before storage and sanitized using HTML entity escaping.
- **Strict Content-Type Envelopes**: Non-GET mutating requests require `Content-Type: application/json` or `multipart/form-data`.

---

## 4. File Upload Defense

- **Allowed MIME Types**: Profile avatars (`image/png`, `image/jpeg`, `image/webp`), Resumes (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
- **Magic Number Verification**: File headers are inspected to verify actual binary signatures rather than relying on user-provided file extensions.
- **Size Bounds**: Avatars capped at 5 MB; Resumes capped at 10 MB.
