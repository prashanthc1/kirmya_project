# Kirmya API Idempotency & Replay Protection

## 1. Idempotency Key Processing
Critical mutating API endpoints (e.g. job application submission, notification dispatch, account deletion) accept an optional `Idempotency-Key` HTTP request header:

- **Key Storage**: Idempotency keys are cached in Redis or PostgreSQL (`notification_deduplications`) with a 24-hour TTL.
- **Replay Behavior**: Duplicate requests matching an active `Idempotency-Key` within its TTL immediately return the cached original HTTP status code and response body without re-executing backend side-effects.
