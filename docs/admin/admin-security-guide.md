# Kirmya Administrative Authentication & Session Security Manual

## 1. Authentication Defenses & Session Control
- **Mandatory MFA (TOTP)**: Privileged administrative access requires step-up TOTP multi-factor authentication.
- **Short-Lived Sessions**: Administrative access tokens expire within 15 minutes of inactivity, requiring automatic renewal.
- **Instant Offboarding**: Disabling an administrator user account immediately invalidates all active session tokens and refresh cookies.
