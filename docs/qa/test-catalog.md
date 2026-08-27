# Kirmya Test Suite Catalog & Verification Inventory

## 1. Backend Test Suites (`backend/`)
- `internal/auth/service`: Registration, Bcrypt login, password reset, TOTP MFA.
- `internal/jobs/service`: Job posting CRUD, search facets, salary filters, closing.
- `internal/application/service`: 1-Click application submission, duplicate blocking, status transitions.
- `internal/interview/service`: Interview scheduling, time-zone normalization, scorecard shielding.
- `internal/community/service`: Group creation, discussions, comments, moderation Desk.
- `internal/notification/service`: Idempotent deduplication, quiet hours, channel routing.
- `internal/security/service`: Session revocation, brute-force throttling, privacy settings.
- `internal/analytics/service`: Cohort minimum thresholds ($k \ge 5$), telemetry ingestion.
