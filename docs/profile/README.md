# Kirmya User Profile & Professional Identity Documentation Hub

Welcome to the Professional Identity, Career Profile, Resume Management, and Privacy Controls documentation for Kirmya.

## Documentation Index

- [`profile-audit.md`](profile-audit.md): Complete audit of profile database entities, sub-resources, and privacy safeguards.
- [`profile-architecture.md`](profile-architecture.md): Entity relationships, domain separation, and CRUD API endpoints.
- [`profile-fields.md`](profile-fields.md): Field constraints, validation rules, and character limits.
- [`profile-privacy.md`](profile-privacy.md): Visibility tiers (Public, Connections Only, Private) and blocklist enforcement.
- [`profile-search.md`](profile-search.md): OpenSearch index mappings, sanitized fields, and NATS event synchronization.
- [`profile-completeness.md`](profile-completeness.md): Profile completeness scoring algorithm and recommendation engine.
- [`resume-management.md`](resume-management.md): Multi-resume uploads, 10MB limits, and 15-minute expiring signed download URLs.
- [`profile-security.md`](profile-security.md): Anti-XSS Bluemonday sanitization, magic byte file validation, and anti-scraping rate limits.

## Profile Frontend Pages

- User Profile Hub: `/profile`
- Public Profile View: `/profile/[username]`
- Profile Settings & Privacy: `/settings/privacy`
