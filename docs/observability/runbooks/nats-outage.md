# SRE Runbook: NATS JetStream Event Outage & Recovery

## 1. Outage Triage
1. Check NATS server CPU/memory and connection metrics.
2. Inspect worker consumer group lag and unacknowledged message queues.
3. Review disk usage on NATS JetStream durable file storage.

---

## 2. Recovery Steps
1. Restart NATS cluster pods if process is deadlocked.
2. Resume consumers and monitor processing rate.
3. Verify event idempotency logic to prevent duplicate notifications or application submissions.
