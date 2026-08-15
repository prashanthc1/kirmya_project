# Security, Privacy, Identity Protection & Trust & Safety System

## Architectural Overview

The **Security, Privacy, Identity Protection & Trust & Safety System** provides multi-layered authentication security, session/device management (`/settings/security/sessions`), login history telemetry (`/settings/security/login-history`), MFA/2FA TOTP lifecycle, brute-force protection, account recovery workflows, Privacy Center controls (`/settings/privacy`), account data export/deletion processing, cookie consent management, platform-wide blocking/reporting, Security Event Notifications integration, OpenTelemetry observability, and OpenAPI documentation.

---

## Authentication & Session Security Architecture

```
User Action (Login / Sensitive API)
       │
       ▼
[ Rate Limiter & Brute-Force Shield ] (Lockout counter: 5 attempts / 15 mins)
       │
       ▼
[ Password & MFA Verification ] (BCrypt / Argon2 + TOTP / Recovery Code)
       │
       ▼
[ Session Manager & Device Fingerprint ]
       │
       ├─► Store Session (PostgreSQL + In-Memory Thread-Safe Cache)
       ├─► Emit Event (NATS: security.login_success)
       └─► Detect Suspicious Login (Trigger Security Notification if new IP/Device)
```

---

## Session & Device Management

Users can inspect and manage all active authentication sessions via `/settings/security/sessions`:
- **Session Telemetry**: IP address, user-agent string, browser, OS, approximate geographic location, last active timestamp.
- **Granular Revocation**:
  - `Revoke Session`: Invalidates a specific target session ID immediately.
  - `Revoke All Other Sessions`: Keeps current active session token while invalidating all other active credentials across devices.

---

## Multi-Factor Authentication (MFA / 2FA)

- **TOTP Specification**: Standard RFC 6238 time-based one-time password standard (Google Authenticator, Authy, 1Password compatible).
- **Setup Workflow**: QR Code SVG / URI generator + 16-character base32 secret.
- **Recovery Codes**: Generates 8 single-use cryptographically secure recovery codes.
- **Verification**: Enforces 6-digit TOTP verification for sensitive account mutations.

---

## Privacy Center & Data Controls

Located at `/settings/privacy`:
- **Profile & Search Visibility**: Toggle public/connections-only profile visibility and search discoverability (syncs across OpenSearch and PostgreSQL fallback).
- **Networking & Messaging Privacy**: Control who can send connection requests or direct messages (Everyone, 2nd-degree connections, Only connections).
- **Subject Access Request (SAR Data Export)**: Request encrypted JSON archives of personal profile data, applications, messages, connections, and consent records.
- **Account Deletion Workflow**: Initiate account deletion with a mandatory **14-day grace period**. Immediate deactivation with automatic deletion/anonymization upon expiration.
- **Cookie & Consent Management**: Granular cookie preferences banner and persistent audit log history (`ConsentHistoryView`).

---

## API Endpoint Reference

### Security & Sessions
- `GET /api/v1/security/overview` — Fetch user security score and status.
- `POST /api/v1/security/password/change` — Update user password with policy evaluation.
- `GET /api/v1/security/sessions` — List active sessions with device/IP details.
- `DELETE /api/v1/security/sessions/:id` — Revoke specific session.
- `POST /api/v1/security/sessions/revoke-all` — Revoke all other active sessions.
- `GET /api/v1/security/devices` — List trusted devices.
- `GET /api/v1/security/activity` — Get login history timeline.
- `POST /api/v1/security/mfa/setup` — Initiate TOTP MFA setup.
- `POST /api/v1/security/mfa/verify` — Verify TOTP code and enable MFA.
- `DELETE /api/v1/security/mfa` — Disable MFA.

### Privacy & Data Controls
- `GET /api/v1/privacy` — Fetch user privacy settings.
- `PATCH /api/v1/privacy` — Update privacy settings.
- `POST /api/v1/privacy/export` — Request personal data export archive.
- `POST /api/v1/privacy/delete-account` — Request account deletion (starts 14-day grace period).
- `GET /api/v1/privacy/consent` — Fetch consent history audit log.
