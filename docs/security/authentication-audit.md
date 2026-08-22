# Kirmya Authentication, Identity & Session Security Audit

## Executive Summary
This document provides a comprehensive audit of the authentication mechanisms, identity lifecycle, password hashing standards, session revocation policies, MFA TOTP verification, and threat mitigation controls for Kirmya.

---

## 1. Authentication Architecture Overview

```
User Login Request (Email + Password)
      │
      ▼
Rate Limiting & Brute-Force Check (IP + Account Lockout Threshold)
      │
      ▼
Bcrypt / Argon2id Password Hash Verification
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

## 2. Cryptographic Credentials & Secret Hygiene Audit

| Credential Type | Cryptographic Storage | Expiration / Lifetime | Exposure Policy |
| :--- | :--- | :--- | :--- |
| **Passwords** | Bcrypt (Cost 12) / Argon2id | N/A (Transparent Rehash) | Never returned in API / Never logged |
| **Access Tokens** | Signed HMAC-SHA256 JWT | 15 Minutes | Short-lived; Bearer Header |
| **Refresh Tokens** | Cryptographic Hash (SHA-256) | 7 Days (Rotated on Use) | HttpOnly Secure Cookie |
| **MFA Secrets** | AES-256-GCM Encrypted | Permanent until disabled | QR Code only during setup |
| **Reset Tokens** | Cryptographic Hash (SHA-256) | 15 Minutes (Single-Use) | Delivered via Email Only |

---

## 3. Account Enumeration Defense
- **Generic Login Responses**: Incorrect email or incorrect password returns identical generic error payload: `{"error": {"code": "UNAUTHORIZED", "message": "Invalid email address or password"}}`.
- **Generic Password Reset Response**: Requesting a password reset for an unregistered email returns HTTP 200 with generic success confirmation: `{"message": "If an account exists for this email, password reset instructions have been sent."}`.
