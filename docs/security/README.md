# Kirmya Security Hardening & Zero-Trust Documentation Hub

Welcome to the Security Hardening, Zero-Trust Architecture, RBAC, Vulnerability Management, and Incident Response documentation for Kirmya.

## Documentation Index

- [`security-architecture.md`](security-architecture.md): Zero-Trust Core Pillars, Defense-in-Depth layer controls, and threat models.
- [`security-hardening.md`](security-hardening.md): Security headers (CSP, HSTS), XSS protection, Bluemonday HTML sanitization, SQL/Search/SSRF injection defenses.
- [`secrets-management.md`](secrets-management.md): Secrets isolation policies, key rotation schedules, and Next.js environment variable security.
- [`vulnerability-management.md`](vulnerability-management.md): Automated Go/Node.js/Container dependency scanning and risk acceptance states.
- [`incident-response.md`](incident-response.md): Incident playbooks for Account Takeover, Secret Leaks, and Malicious File Uploads.
- [`data-inventory.md`](data-inventory.md): Sensitive data classification matrix, storage encryption standards, and access policies.
- [`security-testing.md`](security-testing.md): Automated negative security test suite, IDOR matrix, and rate-limiting enforcement.
- [`authorization-audit.md`](authorization-audit.md): Authorization audit findings, role mappings, and IDOR prevention rules.
- [`authorization.md`](authorization.md): Complete authorization architecture and permission matrix.
- [`rbac.md`](rbac.md): Role hierarchies, permission scopes, and role-to-permission mappings.
- [`permissions.md`](permissions.md): Centralized permission catalog (`resource:action` taxonomy).
- [`resource-ownership.md`](resource-ownership.md): SQL-layer resource ownership filters (`WHERE owner_id = caller_id`).
- [`admin-authorization.md`](admin-authorization.md): Privileged admin authorization and break-glass logging.
- [`tenant-isolation.md`](tenant-isolation.md): Multi-tenant organization isolation boundaries and data shielding.
- [`access-control-testing.md`](access-control-testing.md): Automated negative test cases and IDOR matrices.
- [`authentication.md`](authentication.md): Authentication hardening, Bcrypt cost 12, TOTP MFA, and session security.
- [`account-security.md`](account-security.md): Device management desk, active session revocation, and security events.

## Admin Security UI

- Security Center Dashboard: `/admin/security`
- Role & Permission Desk: `/admin/roles`
- Vulnerability Manager: `/admin/security/vulnerabilities`
- Incident Response Desk: `/admin/incidents`
