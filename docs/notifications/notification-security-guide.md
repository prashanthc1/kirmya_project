# Kirmya Notification Security, Idempotency & Rate Limiting Manual

## 1. Notification Security & Abuse Prevention
- **Idempotency Deduplication**: Unique event keys (`idempotency_key`) prevent duplicate notifications during network retries or event bursts.
- **Deep-Link Authorization Re-Check**: Clicking notification links requires resource-level authorization validation upon reaching destination routes.
- **Rate-Limiting & Anti-Spam**: Recipient-level throttling protects users against notification storms and excessive email dispatches.
