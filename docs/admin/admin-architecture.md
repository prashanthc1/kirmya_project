# Kirmya Admin Platform Architecture & Governance Lifecycles

## 1. Platform Operations & Multi-Tenant Scoping

```
┌─────────────────────────────────────────────────────────────┐
│                 Admin Auth & MFA Gateway                    │
│      (TOTP Validation, Re-Auth Challenges, Session Timers)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Server-Side RBAC Enforcement                │
│    (Super Admin, Platform Admin, Operations, T&S, Support)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│ Two-Person Approval   │  (Approved) │  Transactional Action │
│ (High-Impact Mutation)│ ──────────> │ (PostgreSQL / Redis)  │
└───────────────────────┘             └───────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Immutable Append-Only Audit                 │
│         (Actor ID, Approver ID, Target ID, Reason Code)     │
└─────────────────────────────────────────────────────────────┘
```
