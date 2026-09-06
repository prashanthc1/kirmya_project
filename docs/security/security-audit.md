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

# Kirmya Security Hardening, AppSec & Threat Model Audit

## Executive Summary
This document audits the comprehensive application security posture, OWASP Top 10 & API Security Top 10 defenses, cryptographic standards, AI prompt injection defenses, file upload sandboxing, and penetration testing readiness across Kirmya.

---

## 1. Multi-Layer Defense in Depth

```
                 Edge / CDN WAF (Cloudflare TLS 1.3 / DDoS)
                                    │
                                    ▼
                API Gateway / Middleware Security Headers
                 ├── Content-Security-Policy & Frame-Options
                 ├── Strict Origin CORS & SameSite Cookie Check
                 └── Redis Distributed Token Bucket Rate Limiter
                                    │
                                    ▼
                Input Validation & Sanitization Layer
                 ├── BlueMonday HTML Sanitizer (XSS Elimination)
                 ├── Parameterized SQL Engine (SQLi Elimination)
                 └── SSRF Blocklist (Private IP & Loopback Filter)
                                    │
                                    ▼
                Server-Authoritative RBAC & ABAC
                 ├── Resource Ownership Scoping (`WHERE owner_id = $1`)
                 └── Field-Level PII Masking (Candidate Privacy)
```

---

## 2. OWASP Top 10 Coverage Matrix
- **A01: Broken Access Control**: Strict server-side resource ownership checks (`WHERE id = $1 AND owner_id = $2`) preventing IDOR.
- **A02: Cryptographic Failures**: Bcrypt cost 12 password hashing, TLS 1.3 in transit, and AES-256 for sensitive stored archives.
- **A03: Injection**: 100% parameterized SQL queries (`pgxpool`) and strict regex validation for all query inputs.
- **A04: Insecure Design**: Minimum group size thresholds (k >= 5) for analytics and independent review for moderation appeals.
- **A05: Security Misconfiguration**: Automated SAST, non-root container runtimes, and zero hard-coded secrets.
