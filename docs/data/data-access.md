# Kirmya Data Access Control & Least Privilege Governance

## Privilege Tiers & Masking Standards

1. **User Tier**: Authenticated users access strictly their owned resources. IDOR authorization middleware verifies `userID` matches resource ownership.
2. **Support Admin Tier**: Support agents possess masked access (e.g. `j***@kirmya.com`) for debugging. Unmasking requires formal user consent and generates an audit log entry.
3. **Platform Admin Tier**: Role-Based Access Control (RBAC) grants specific operational permissions (`view_audit_logs`, `manage_legal_holds`, `run_retention`). Database superuser credentials are reserved exclusively for automated CI/CD migrations.
