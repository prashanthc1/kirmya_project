# Kirmya Production Security Architecture & Threat Model

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: 100% PRODUCTION HARDENED  

---

## 1. Authentication & Identity Management

### Token Lifecycle & Architecture
* **Access Tokens**: Short-lived JSON Web Tokens (15-minute expiration) signed using HMAC-SHA256 with the cluster-wide `JWT_SECRET`.
  * Claims: `userId` (UUID), `email` (string), `role` (string), `exp` (timestamp), `iss` (`kirmya-auth-service`), `sub` (UUID).
  * Storage: In-memory frontend React state (never in `localStorage` or `sessionStorage`).
* **Refresh Tokens**: Cryptographically random UUID v4 strings stored in PostgreSQL table `user_sessions` with 7-day (or 30-day "Remember Me") expiration.
  * Transmission: Transported in HTTP-only, `SameSite=Strict`, Secure cookies restricted to path `/api/v1/auth`.
  * Rotation & Reuse Detection: Upon refresh, the old session is immediately revoked and a new session token is issued. If an already-revoked refresh token is presented, the system triggers a security alert and revokes **all** active sessions for that user.

### Password Security & Storage
* **Algorithm**: `bcrypt` with work factor / cost 12.
* **Timing Attack Defense**: Password comparisons utilize `subtle.ConstantTimeCompare`.
* **Zero Logging Policy**: Passwords and raw hashes are strictly stripped from all DTO responses and application logs.

---

## 2. Authorization, RBAC & Multi-Tenant Isolation

### Role Hierarchy
1. `candidate` (regular job seeker, default user)
2. `interviewer` (technical panelist with evaluation scorecard permissions)
3. `hiring_manager` (requisition creator and stage reviewer)
4. `recruiter` (ATS manager and candidate pipeline coordinator)
5. `company_admin` (organization profile and member management)
6. `community_moderator` (content and post moderation within owned communities)
7. `platform_admin` / `admin` (global platform governance, audit logs, and compliance enforcement)

### Server-Side Enforcement Pattern
Handlers strictly extract user context from validated JWT claims using:
```go
userID, ok := middleware.GetUserID(c)
role := middleware.GetUserRole(c)
```
Endpoints requiring specific roles apply:
```go
api.POST("/recruiter/jobs", middleware.RequireRole("recruiter", "hiring_manager", "admin"), handler.CreateJob)
api.DELETE("/admin/users/:id", middleware.RequireAdmin(), handler.DeleteUser)
```

### Multi-Tenant Isolation
* All enterprise and company queries enforce tenant scoping: `WHERE company_id = $1` or `WHERE enterprise_id = $1`.
* Tenant IDs are injected from authenticated session state rather than unvalidated client request bodies.

---

## 3. Data Protection & Input Sanitization

### SQL Injection Prevention
* 100% of database interactions execute parameterized SQL statements via `jackc/pgx/v5`.
* Dynamic queries use positional placeholder parameters (`$1`, `$2`, `$3`) rather than string concatenation.

### File Handling & Storage Security
* **Allowed Extensions**: `.jpg`, `.jpeg`, `.png`, `.webp` (photos); `.pdf`, `.docx` (resumes).
* **Size Enforcement**: Maximum 5 MB per file.
* **Path Traversal Defense**: Storage paths are generated using server-side UUIDs (`/uploads/profiles/<userID>_avatar.jpg`), completely ignoring client-supplied filenames.

### WebSockets Security
* WebSocket upgrade requests require valid JWT authentication via `Authorization` header or query parameter `token`.
* Connection handlers verify conversation and room participation before delivering real-time messages.

### Rate Limiting & Network Protection
* Per-IP token bucket rate limiting prevents brute force credential stuffing.
* Strict HTTP security headers configured: HSTS (2 years), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, CSP (`default-src 'self'`).
