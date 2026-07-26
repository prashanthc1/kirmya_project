# Kirmya Security Audit & Enforcement Documentation

This document logs the security posture, configurations, and architectural enforcement patterns of the Kirmya application.

---

## 1. Database Security Policy

### Role & Permissions Management
In a production deployment, applications must never connect using superuser roles (e.g. `postgres`). We enforce a separated privileges structure:
- **`kirmya_app_role`**: This restricted role holds runtime DML access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) on application tables. It is denied DDL permissions to prevent runtime schema tampering or injection exploits from executing schema changes.
- **`kirmya_migration_role`**: Dedicated schema migration role used only during deployments.

### Sensitive Data Storage
- **Credentials**: Passwords are never stored in plain text. We hash passwords using the **Bcrypt** algorithm with an explicit work factor cost of **12** (producing a safe 60-character hash).
- **Refresh Sessions**: Refresh token values are stored in the database. Rotation uses secure UUIDs generated on the server. Old refresh tokens are explicitly marked `is_revoked = TRUE`.

### Index Security
- Unique indexes on `usr_accounts(email)` and `refresh_tokens(token)` protect lookup operations against slow queries, defending the database pool against Denial of Service (DoS) and indexing-based timing attacks.

---

## 2. JWT & Token Rotation Policy

### Dual-Token Structure
- **Access Tokens**: Short-lived (15 minutes), signed using a cryptographic HMAC-SHA256 signature. These are passed in the `Authorization` header as Bearer tokens. They are held strictly in client memory (React state) to prevent XSS collection.
- **Refresh Tokens**: Long-lived (7 days), stored in a cookie. To eliminate CSRF vulnerabilities, the cookie is set with:
  - `HttpOnly`: Blocking JavaScript accessibility.
  - `Secure`: Ensuring it is only sent over TLS connections.
  - `SameSite=Strict`: Restricting cross-site transmission.
  - `Path=/api/v1/auth`: Ensuring the cookie is only exposed to token renewal routes.

### Refresh Token Rotation (RTR) & Reuse Detection
When a client requests a new access token using a refresh token:
1. The server checks the refresh token in the database.
2. If it is already marked `is_revoked`: The server triggers a **Breach Countermeasure**, immediately revoking all refresh tokens issued to that user (`RevokeAllUserTokens`), forcing all devices to log out.
3. If it is valid: The server revokes the current token, generates a new refresh token, and returns it.

---

## 3. Rate Limiting Policy

To defend against brute-force attacks and credentials stuffing:
- The `/api/v1/auth/*` route group is protected by an in-memory sliding token bucket rate-limiter middleware.
- **Limits**: Maximum of 5 requests per minute per IP address.
- **Response**: Exceeded limits return `429 Too Many Requests`.

---

## 4. Exploit Protections

### CSRF Protection
- Restricting cookies to `SameSite=Strict` and enforcing that all operations requiring authorization use standard header-based Bearer `Authorization` tokens (which browser forms cannot automatically attach) mitigates CSRF attacks.

### XSS Mitigation (Security Headers)
The application globally injects security hardening headers:
- **`Content-Security-Policy` (CSP)**: Restricts script, style, image, and socket connections to trusted sources, mitigating script injection vectors.
- **`X-Frame-Options: DENY`**: Prevents clickjacking by blocking the app from being rendered in frames.
- **`X-Content-Type-Options: nosniff`**: Prevents browsers from executing files based on sniffed MIME types.
- **`Strict-Transport-Security` (HSTS)**: Forces HTTPS connections for 2 years (including subdomains).

### SQL Injection Prevention
- All database queries (pgx) use parameterized placeholders (e.g. `$1`, `$2`), preventing query parameter interpolation and SQL injection vectors.
