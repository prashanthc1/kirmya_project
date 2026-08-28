# Kirmya Notification Platform Testing & Verification Suite Manual

## 1. Automated Verification & Testing Matrices
- **Unit & Service Tests**: Validates idempotency deduplication, quiet hours filtering, channel preferences matrix, and dead-letter retry logic.
- **Integration Test Scenarios**: Simulates provider timeout failures, exponential backoff sequences, and transactional outbox event consumption.
- **Golden Route Verification**: Confirms router consistency for notification endpoints under `/api/v1/notifications/...`.
