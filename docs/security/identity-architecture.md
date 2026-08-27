# Kirmya Identity Architecture, Session Management & Token Lifecycles

## Executive Summary
This document defines the unified Identity Architecture, Session Revocation Engine, Bcrypt Password Hashing, Ephemeral Token Lifecycles, and Multi-Device Management across Kirmya.

---

## 1. Identity & Session Lifecycle

```
                                  Client Request (Browser / App)
                                                │
                                  HttpOnly SameSite=Strict Cookie
                                                │
                                                ▼
                                    Auth & Session Middleware
                         ├── Session Validation (PostgreSQL + Redis Cache)
                         ├── Rate Limiting (10 req/min for auth actions)
                         └── Context Enrichment (Caller ID, Org ID, Role)
                                                │
                       ┌────────────────────────┼────────────────────────┐
                       ▼                        ▼                        ▼
                Public Endpoints        Authenticated User        Privileged Admin
               (Anonymous Allowed)    (Ownership Enforced)       (RBAC Verified)
```
