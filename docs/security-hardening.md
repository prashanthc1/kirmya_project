# Kirmya Security Hardening, Threat Model & Defensive Architecture Guide

## 1. Threat Model & Actor Taxonomy

Kirmya evaluates security against five primary threat actor classifications:

```
                      [Threat Landscape]
                               │
       ┌───────────────┬───────┴───────┬───────────────┐
       ▼               ▼               ▼               ▼
[Anonymous Bot]  [Malicious User] [Compromised Org] [Rogue Admin]
(Scraping/DOS)   (IDOR / Tamper)  (Tenant Sniffing) (Privilege Abuse)
```

---

## 2. Trust Boundaries & Defense-in-Depth Matrix

| Security Layer | Boundary / Mechanism | Enforcement Strategy |
| :--- | :--- | :--- |
| **Edge / Transport** | TLS 1.3, Strict CORS, Security Headers | HSTS, CSP, `X-Content-Type-Options: nosniff` |
| **Authentication** | Dual-token (JWT + Refresh Cookies) | `SameSite=Strict; HttpOnly; Secure`, Brute-Force Lockout |
| **Authorization** | Server-side RBAC & IDOR Ownership | Zero trust of client IDs; identity extracted via context |
| **Database Access** | Parameterized SQL via pgxpool | 100% SQL injection immunity; least-privilege DB user |
| **File Storage** | Strict MIME & Magic Byte Validation | UUID-isolated keys, signed download URLs ($10\text{MB}$ max) |
| **AI Intelligence** | Prompt Injection Demarcation | User resumes/jobs demarcated as untrusted input |
| **Administrative Console** | 7-Tier RBAC & 15-min Impersonation | Append-only audit logs, mandatory business justification |

---

## 3. Threat Mitigation Summary

1. **Zero IDOR / BOLA**: All resource mutations (`profile`, `resume`, `application`, `message`, `connection`) strictly cross-reference `c.Get("userID")` with the target resource owner.
2. **Strict Multi-Tenant Isolation**: Recruiter ATS pipelines, candidate notes, and scorecards enforce `organization_id` predicates across all SQL queries.
3. **Data Minimization & Redaction**: PII, passwords, session tokens, and credit card patterns are scrubbed from telemetry, error payloads, and audit logs.
