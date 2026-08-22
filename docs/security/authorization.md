# Kirmya Complete Authorization System Architecture

Welcome to the Authorization, RBAC Matrix, IDOR Mitigations, Tenant Isolation, and Access Control Testing documentation for Kirmya.

## Documentation Index

- [`authorization-audit.md`](authorization-audit.md): Complete audit of authentication vs authorization, role hierarchies, and default deny policies.
- [`permissions.md`](permissions.md): Centralized `resource:action` permission catalog.
- [`resource-ownership.md`](resource-ownership.md): IDOR/BOLA prevention and database query-level scoping patterns.
- [`tenant-isolation.md`](tenant-isolation.md): Multi-tenant organization boundaries and cross-tenant access defenses.
- [`admin-authorization.md`](admin-authorization.md): Admin RBAC, support impersonation protocol (15m TTL), and audit logging.
- [`access-control-testing.md`](access-control-testing.md): Negative authorization test matrix (TC-AUTHZ-01 to TC-AUTHZ-05).

## Security Matrix Overview

```
Client API Request
      │
      ▼
Authentication Middleware (Validates JWT / Session)
      │
      ▼
Role Verification (RBAC Check via User Claims)
      │
      ▼
Service Layer Ownership Verification (ABAC / IDOR Check)
      │
      ▼
Database Query Execution (Scoped with WHERE owner_id = caller_id)
```
