# Kirmya Webhook & Event Integration Architecture

## 1. Webhook Security & Signing
- **HMAC-SHA256 Signatures**: Every outbound webhook delivery payload contains an `X-Kirmya-Signature` header computed using an HMAC-SHA256 secret.
- **Timestamp Anti-Replay**: Webhook headers include `X-Kirmya-Timestamp` to prevent replay attacks beyond a 5-minute validity window.

---

## 2. Delivery & Exponential Backoff Retry
- Outbound delivery failures execute exponential backoff retries (`10s`, `1m`, `5m`, `30m`, `2h`, `12h`, max 6 attempts).
- Permanently failing destinations are automatically disabled after 10 consecutive failures.
