# Kirmya Zero-Trust Security Architecture

## Executive Summary
This document outlines the Zero-Trust Security Architecture, Defense-in-Depth layer controls, encryption standards, threat models, and security boundary enforcement for the Kirmya platform.

---

## 1. Zero-Trust Core Pillars

```
                        Client HTTP Request
                                 │
                                 ▼
           TLS 1.3 Termination & Security Headers (CSP, HSTS)
                                 │
                                 ▼
             Global Rate Limiting & Abuse Shielding (Redis)
                                 │
                                 ▼
           Authentication Middleware (Bearer JWT / Cookie Validation)
                                 │
                                 ▼
           Authorization & RBAC Enforcer (Resource & Role Scoping)
                                 │
                                 ▼
           Input Sanitization & Injection Defense (BlueMonday / SQL Bindings)
                                 │
                                 ▼
           PostgreSQL / S3 Isolation (Query-Level Row Owner Scoping)
```

| Security Layer | Core Control Mechanism | Verification & Audit |
| :--- | :--- | :--- |
| **Edge / Network** | TLS 1.3, Strict CSP, CORS Allowlist, Rate Limiting | OpenTelemetry Security Spans |
| **Authentication** | Bcrypt (Cost 12), TOTP MFA, Short-lived JWTs (15m) | Login History & Session Logs |
| **Authorization** | Centralized `resource:action` RBAC + IDOR Protection | Negative Authorization Tests |
| **Data Protection**| AES-256 GCM Storage, Bluemonday HTML Sanitization | Data Inventory & Audit Logs |
