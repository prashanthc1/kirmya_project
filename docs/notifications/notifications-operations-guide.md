# SRE Operations Guide: Notification Queues, Email Delivery & DLQ Management

## 1. Monitoring & Dead-Letter Queue (DLQ) Triage
1. **Queue Backlog Metrics**: Track NATS JetStream consumer lag and delivery latency percentiles (P95/P99).
2. **Provider Failures**: Automatic exponential backoff (1s, 2s, 4s, 8s, 16s) up to 5 attempts before quarantine in the DLQ.
3. **Admin Retries**: Trigger idempotent batch retries of failed deliveries via the Admin Notification Center (`/admin/notifications`).
