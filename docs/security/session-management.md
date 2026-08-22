# Kirmya Session Management & Revocation Protocol

## 1. Session Lifecycle & Token Rotation
- **Access Token**: Short-lived (15 minutes), containing user ID, role, and session ID.
- **Refresh Token Rotation**: Each refresh request invalidates the consumed refresh token and issues a new paired refresh token.
- **Replay Detection**: If a previously consumed refresh token is presented, the system flags a potential token theft event, revokes the entire session family, and emits a Security Alert Notification.

---

## 2. Session Revocation Controls
- **Current Session Logout**: Destroys active refresh cookie and invalidates session in Redis/PostgreSQL.
- **Revoke All Other Sessions**: Destroys all active user sessions except the current requesting session.
- **Device Management Desk**: Users view active devices (`/settings/security/sessions`) and selectively terminate unrecognized device sessions.
