# Kirmya Alerting Rules, Severities & Notification Routing

## 1. Alert Severity Classification & Response Matrix

| Severity | Threshold Condition | Target Channel | Response SLA |
| :--- | :--- | :--- | :--- |
| **Critical (P1)** | HTTP 5xx Error Rate > 2% for 3m, or DB unreachable | PagerDuty / On-Call SMS | < 15 minutes |
| **High (P2)** | P95 Latency > 1000ms for 5m, or Queue Depth > 1,000 | Slack `#ops-alerts` | < 30 minutes |
| **Medium (P3)** | Redis Memory > 80%, or Worker DLQ count > 50 | Slack `#ops-warnings` | < 4 hours |
| **Low (P4)** | Informational telemetry warnings | Daily Digest Email | Next business day |
