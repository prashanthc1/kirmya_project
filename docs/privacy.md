# Kirmya Privacy Operations & Data Subject Rights System

## Overview
The Kirmya Privacy System manages user consent preferences, data subject request (DSR) lifecycles (Right to Access / Data Portability, Right to Erasure / Account Deletion), sensitive data sanitization, and legal hold shielding under GDPR, CCPA, and global data protection regulations.

## Data Subject Request (DSR) Lifecycle

```
[ User / Admin ] ---> Request Creation (Export / Deletion)
                            |
                            v
                     Status: Pending
                            |
                            v
              Check Active Legal Hold Shield?
                 /                    \
     YES (Hold Active)             NO (No Hold)
            |                            |
    Block Request with                   v
  ErrUserUnderLegalHold          Process Request
            |                   /              \
            v             Data Export     Account Deletion
      Reject / Halt     Assemble Package   Anonymize / Purge
                            |                    |
                            v                    v
                   Strip Credentials       Status: Completed
                   Status: Completed
```

### 1. Data Export Requests (Right of Access / GDPR Art. 15 / CCPA)
- Users can request a complete archive of their personal data.
- The system gathers profile data, experiences, education, skills, job applications, saved jobs, connections, community memberships, mentorship records, learning progress, and notification settings.
- **Sanitization Rule**: Credential fields including `password_hash`, `mfa_secret`, `totp_key`, `api_token`, and internal security audit keys are **strictly stripped** before serialization.
- Upon completion, a secure, time-limited JSON package URL is generated for download.

### 2. Account Deletion Requests (Right to be Forgotten / GDPR Art. 17 / CCPA)
- Users can request total deletion or anonymization of their account data.
- **Legal Hold Check**: Prior to processing, the service checks `IsUserUnderLegalHold`. If an active legal hold exists for the target user, deletion is **immediately blocked** and returns `ErrUserUnderLegalHold`.
- If no legal hold exists, user profile and associated personal data records are purged/anonymized across relational databases, search indexes, and cache layers while preserving mandatory legal audit trails.

## Consent Management
- Users can grant or withdraw granular consent for:
  - **Analytics Tracking** (`ConsentAnalytics`)
  - **Marketing & Promotional Communications** (`ConsentMarketing`)
  - **Third-Party Data Sharing** (`ConsentThirdParty`)
- Essential system operation telemetry remains enabled for platform security and compliance.
- Every consent change records timestamp, IP address, user ID, and audit log event.

## Legal Hold Shielding
- Compliance and Legal teams can place a `LegalHold` on any user account involved in active litigation, regulatory investigation, or fraud audits.
- Active legal holds override user deletion requests and automated retention purge schedules until explicitly released by authorized legal personnel.
