# Kirmya Data Subject Access Request (DSAR) Export Protocol

## 1. Export Package Contents
Under privacy compliance specifications, a user data export includes:
- User Profile (Name, headline, location, bio, creation timestamp).
- Work Experiences, Educations, Skills, Endorsements.
- Job Applications & Saved Jobs history.
- Network Connections & Community Memberships.
- Notification Preferences & Consent Records.

## 2. Export Security Controls
- **Password Hashes & Tokens Stripped**: Export engine explicitly excludes password hashes, MFA secrets, JWT tokens, and API key values.
- **Short-Lived Signed Download Link**: Export ZIP bundles are stored in temporary object storage with a 24-hour expiration token.
- **Access Audit**: All DSAR requests and downloads are recorded in the append-only audit trail.
