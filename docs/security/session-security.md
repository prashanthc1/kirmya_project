# Kirmya Session Security, JWT Rotation & Device Management Manual

## 1. Session Lifecycle & Token Management
- **HttpOnly & Secure Cookies**: JWT refresh tokens are stored in `SameSite=Strict`, `HttpOnly`, `Secure` cookies with 7-day expiration.
- **Short-Lived Access Tokens**: Ephemeral access tokens expire after 15 minutes, limiting exposure if intercepted.
- **Session Revocation**: Users and administrators can instantly revoke all other active sessions via `/api/v1/security/sessions/revoke-others`.
