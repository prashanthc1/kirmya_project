# Kirmya Notification Retry Strategy & Dead Letter Queues

## 1. Exponential Backoff Policy
External email provider dispatches execute with bounded exponential backoff:
```
Delay = min(InitialInterval * (2 ^ attempt), MaxInterval) + jitter
```
- **Initial Interval**: 5 seconds
- **Max Retries**: 5 attempts
- **Max Interval**: 10 minutes

---

## 2. Dead Letter Queue (DLQ)
Dispatches that exhaust maximum retries are routed to the Dead Letter Queue (`kirmya.notifications.dlq`) with full error diagnostics, accessible via the Admin Operations Console (`/admin/notifications/dlq`).
