# Kirmya Security, Privacy & Data Protection Comprehensive Audit

## Executive Summary
This document audits the zero-trust security architecture, client-side input validation, password security parameters, session management, CSRF/CORS/CSP security headers, granular profile privacy controls, recruiter discoverability toggles, cookie consent versioning, and GDPR/CCPA data rights pipelines in Kirmya.

---

## 1. Security Architecture & Zero Trust Model

```
                    Incoming HTTP Request (TLS 1.3 Termination)
                                         │
                                         ▼
                     Edge Security Headers & Global Rate Limiter
                      ├── Content-Security-Policy (CSP)
                      ├── Strict-Transport-Security (HSTS)
                      └── Redis Token Bucket (60 req/min/IP)
                                         │
                                         ▼
                     Authentication & Session Verification
                      ├── HttpOnly, Secure, SameSite=Strict Cookie
                      ├── Bcrypt Cost 12 / TOTP MFA Verification
                      └── Active Session Revocation Verification
                                         │
                                         ▼
                     Authorization & Resource Ownership
                      ├── Server-Side RBAC (`resource:action`)
                      └── SQL Resource Ownership (`WHERE owner_id = caller_id`)
                                         │
                                         ▼
                     Input Sanitization & Output Filtering
                      ├── BlueMonday HTML Sanitizer
                      └── Field-Level Privacy Masking (Phone, Email, Resume)
```

---

## 2. Privacy & User Data Controls
- **Granular Profile Visibility**: Users configure profile visibility across `Public`, `Connections Only`, and `Private`.
- **Recruiter Discoverability**: Candidates can opt out of recruiter search and AI matching pipelines with instant effect.
- **GDPR / CCPA Data Rights**: Structured JSON machine-readable data export (`/settings/privacy/export`) and safe 30-day graceful account deletion (`/settings/privacy/delete-account`).
