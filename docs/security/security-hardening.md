# Kirmya Production Security Hardening & Application Security Controls

## 1. Security Headers & Content Security Policy (CSP)
- **HSTS**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- **X-Content-Type-Options**: `nosniff`
- **X-Frame-Options**: `DENY`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Content-Security-Policy**:
  ```http
  default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';
  ```

---

## 2. Injection & Input Sanitization
- **SQL Injection**: 100% parameterized SQL query execution via PostgreSQL `pgxpool`. Concatenated query strings are prohibited.
- **XSS Protection**: HTML content sanitized via `bluemonday.UGCPolicy()`.
- **OpenSearch Query Injection**: Structured JSON query builders isolate user text input from query syntax.
- **Command Injection**: Zero raw `os/exec` invocations accepting user-controlled arguments.
- **SSRF Protection**: URL fetchers enforce strict scheme (`https://`) and host allowlists, blocking local network ranges (`127.0.0.1`, `10.0.0.0/8`, `169.254.169.254`).
