# Kirmya Account Deletion & Data Anonymization Protocol

## 1. User Deletion Request Lifecycle

1. **Verification**: User requests account deletion via `/settings/privacy/delete-account` with mandatory password confirmation.
2. **Legal Hold Check**: System verifies user is not subject to an active `LegalHold` (returns `ErrUserUnderLegalHold` if active).
3. **Grace Period**: Account is marked `pending_deletion` for a 30-day grace period during which the user can cancel the request.
4. **Purge & Anonymization Engine**:
   - Removes private identity attributes (email, phone, name, password hash).
   - Anonymizes posts and community contributions (`Author: "Deleted User"`).
   - Evicts Redis sessions and invalidates OpenSearch indexes.
   - Archives non-identifiable transaction metrics for auditing.
