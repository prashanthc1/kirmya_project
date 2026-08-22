# Kirmya Authentication & Application Security Documentation

Welcome to the Authentication, Identity Lifecycle, Session Security, and Threat Model documentation for Kirmya.

## Documentation Index

- [`authentication-audit.md`](authentication-audit.md): Complete audit of identity lifecycle, password hashing, and token hygiene.
- [`authentication.md`](authentication.md): Decoupled identity architecture, session fixation prevention, and MFA workflows.
- [`session-management.md`](session-management.md): Token rotation, refresh replay detection, and device revocation controls.
- [`password-policy.md`](password-policy.md): Password strength rules, Bcrypt cost 12 parameters, and transparent rehashing.
- [`email-verification.md`](email-verification.md): Cryptographic token generation, hashed storage, and single-use enforcement.
- [`password-reset.md`](password-reset.md): Reset token workflow and automated session revocation upon password update.
- [`account-security.md`](account-security.md): Brute-force lockout thresholds, 0-100 account risk scoring, and security alerts.
- [`auth-threat-model.md`](auth-threat-model.md): STRIDE-aligned threat matrix and mitigation mappings.

## User Security Center UI

- User Security Dashboard: `/settings/security` (Password Manager, Session Manager, MFA Setup, Security Event Log).
- Admin SOC Control Desk: `/admin/security` (Executive Threat Desk, Brute-Force Monitor, Active Incident Stream).
