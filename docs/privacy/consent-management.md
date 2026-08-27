# Kirmya Legal Consent & Cookie Preferences Management

## 1. Consent Versioning & Tracking
- Every consent change (Terms of Service, Privacy Policy, Cookie Preferences, AI Processing) writes an append-only row to `consent_records` (`user_id`, `policy_type`, `version`, `consented_at`, `ip_address`).

---

## 2. Granular Cookie Control
- **Essential**: Session management and CSRF tokens (always active).
- **Preferences**: Theme (light/dark mode) and UI density.
- **Analytics**: Optional aggregate performance telemetry.
