# SRE Runbook: REST API Operations & Traffic Triage

## 1. Rate-Limiting & Throttling Triage
1. Inspect 429 response rate metrics in Grafana (`http_requests_total{status="429"}`).
2. Verify Redis token bucket counters for affected IP or client API keys.
3. If an automated integration requires increased throughput, adjust client quota in admin console (`/admin/system/api-keys`).
