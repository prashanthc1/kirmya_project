# Kirmya Account Deletion, Hard Erasure & Anonymization Lifecycle

## 1. 30-Day Graceful Deletion Lifecycle
1. **Request Initiation**: User requests deletion via `/settings/privacy/delete-account` with password confirmation.
2. **Soft Deactivation & Shielding**: Account marked `deleted_at = NOW()`; session tokens revoked instantly, public profiles delisted from search within 60 seconds.
3. **Hard Erasure (Day 30)**: Permanent deletion cascade purges profile bios, resumes, and direct messages; shared community contributions are scrubbed and anonymized as `Deleted User`.
