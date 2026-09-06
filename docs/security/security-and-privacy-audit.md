<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F01 (Application timeline omits candidate ownership); F02 (Privacy and consent operations return success without persistence); F12 (Security workflow deliberately suppresses scan failures).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

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
