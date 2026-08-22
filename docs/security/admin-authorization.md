# Kirmya Admin Authorization & Support Impersonation Protocol

## 1. Admin RBAC Enforcer
Admin API routes (`/api/v1/admin/...`) require authenticated sessions carrying elevated platform roles (`Super Admin`, `Platform Admin`, `Trust & Safety Admin`, `Support Admin`).

## 2. Support Impersonation Protocol
- **Reason Mandate**: Support personnel must enter an explicit ticket/justification reason to initiate impersonation.
- **Short Lifetime**: Impersonation tokens automatically expire after 15 minutes.
- **Audit Logging**: Every impersonated request logs `AdminID`, `ImpersonatedUserID`, `Action`, and `Reason` to PostgreSQL append-only audit tables.
- **Secret Shielding**: Impersonation sessions yield temporary scoped bearer tokens; raw user passwords and TOTP secrets are never exposed.
