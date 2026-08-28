# Kirmya Authentication, Identity & Session Security Audit

## Executive Summary
This document provides a comprehensive security audit of Kirmya's identity, authentication, authorization, session management, account recovery, email verification, and account lifecycle architecture.

---

## 1. Authentication Architecture Overview

```
User Login Request (Email + Password)
      │
      ▼
Rate Limiting & Brute-Force Check (IP + Account Lockout Threshold)
      │
      ▼
Bcrypt (Cost 12) Password Hash Verification (subtle.ConstantTimeCompare)
      │
      ├───────────────────────┬───────────────────────┐
      ▼                       ▼                       ▼
Generic Error Response    MFA Challenge           JWT Token Generation
(If invalid credentials)  (If TOTP Enabled)       (Access + Refresh Pair)
                                                      │
                                                      ▼
                                           Session & Device Registration
                                           (PostgreSQL + Redis Active Cache)
```

---

## 2. Credential Security & Cryptographic Storage

| Credential Type | Cryptographic Storage | Expiration / Lifetime | Exposure Policy |
| :--- | :--- | :--- | :--- |
| **Passwords** | Bcrypt (Cost 12) | Permanent until changed | Never returned in API responses; Never logged (`json:"-"`) |
| **Access Tokens** | Signed HMAC-SHA256 JWT | 15 Minutes | Short-lived; Bearer Authorization Header |
| **Refresh Tokens** | Cryptographic UUIDv4 / SHA-256 | 7 Days (30 Days with RememberMe) | `HttpOnly`, `Secure`, `SameSite=Strict` Cookie; Rotated on every use |
| **MFA TOTP Secrets** | Base32 Encrypted | Permanent until disabled | Displayed via QR Code only during initial enrollment |
| **Email Verification Tokens** | Cryptographic UUIDv4 | 24 Hours (Single-Use) | Delivered via Email; Deleted upon verification |
| **Password Reset Tokens** | Cryptographic SHA-256 Hash | 15 Minutes (Single-Use) | Delivered via Email only; Expired immediately on reset |

---

## 3. Account Enumeration Defense

- **Sign-In Protection**: Invalid email and invalid password return identical generic error messages (`"invalid email or password"`), preventing attackers from enumerating valid account emails.
- **Forgot Password Protection**: Requesting a password reset for an unregistered email returns an identical HTTP 200 generic message: `"If an account exists with this email, password reset instructions have been sent."`
- **Email Verification Resend**: Resend requests return a consistent success message regardless of previous verification status.

---

## 4. Session Security, Rotation & Reuse Detection

1. **Sliding Window Refresh & Rotation**: On every `/api/v1/auth/refresh` call, the old refresh token is revoked in PostgreSQL and a fresh refresh token is issued.
2. **Replay & Reuse Detection**: If an already-revoked refresh token is presented, the system detects potential session hijacking, immediately revokes **all** active sessions for that user, and emits a high-priority security audit event (`REFRESH_TOKEN_REUSE_DETECTED_ALL_SESSIONS_REVOKED`).
3. **Session Revocation**:
   - `DELETE /api/v1/security/sessions/:id`: Revokes a specific session.
   - `POST /api/v1/security/sessions/revoke-others`: Revokes all sessions except the current active one.
   - Password changes and administrative bans immediately invalidate all active sessions.

---

## 5. Account Lifecycle & Status State Machine

| Account State | Login Permitted | API Access Permitted | Notes |
| :--- | :---: | :---: | :--- |
| `active` | Yes | Yes | Full platform capabilities |
| `pending_verification`| Yes | Limited | Prompted to complete email verification |
| `suspended` | No | No | Blocked by Trust & Safety moderation action |
| `locked` | No | No | Temporarily locked out due to >= 5 failed login attempts (15-minute cooldown) |
| `disabled` | No | No | Administrative disablement |
| `deleted` | No | No | Anonymized / purged under GDPR right-to-be-forgotten |

---

## 6. Rate Limiting & Abuse Prevention Controls

- **Authentication Rate Limiting**: `5 requests / minute` per IP address across `/api/v1/auth/login`, `/api/v1/auth/register`, and `/api/v1/auth/reset-password`.
- **Brute Force Lockout**: 5 consecutive failed logins trigger temporary account lockout for 15 minutes.
- **Memory Safety**: Fallback rate limiter uses sliding time windows with bounded maps and automatic eviction to prevent memory leaks during Redis offline scenarios.

---

## 7. Security Logging & Audit Hygiene

- **Logged Events**: User registration, login success, login failure, email verification, password change, MFA setup, session revocation, token reuse alerts, and administrative actions.
- **Strictly Prohibited from Logs**:
  - Raw passwords and plaintext passwords
  - Bcrypt password hashes
  - JWT access tokens and secret signing keys
  - Refresh token values and cookies
  - MFA TOTP secret keys and recovery codes
  - Email verification and password reset tokens
