# SRE Operations Guide: Notification Queues & Dead-Letter Triage

## 1. Dead-Letter Queue (DLQ) Management
1. Inspect failed delivery queue in Admin Console (`/admin/system/jobs`).
2. Identify root cause for delivery failure (e.g. SMTP rate limit, invalid recipient address, webhook timeout).
3. Trigger idempotent batch retry via admin API (`POST /api/v1/notifications/admin/dlq/retry`).
