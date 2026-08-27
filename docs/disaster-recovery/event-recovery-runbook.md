# SRE Runbook: NATS JetStream Event Recovery & Idempotent Replay

## 1. JetStream Stream Recovery
1. Re-create corrupted stream: `nats stream add kirmya-events --storage=file`.
2. Replay unacknowledged messages from durable storage offsets.
3. Validate that consumer deduplication handles replayed events idempotently without double-processing job applications or sending duplicate emails.
