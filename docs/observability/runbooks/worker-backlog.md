# SRE Runbook: Background Worker Backlog & Queue Saturation

## 1. Backlog Detection
1. Check `worker_queue_depth` metric in Grafana.
2. Inspect NATS consumer lag and processing error rates.
3. Review dead-letter queue (`kirmya.dlq`) message count.

---

## 2. Mitigation Steps
1. Scale worker replica concurrency from 20 to 50 goroutines.
2. Check if third-party downstream provider (Email/SES, AI LLM) is throttling requests.
3. Drain poisoned DLQ messages to staging for offline inspection.
