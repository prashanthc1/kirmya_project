# Kirmya Service Level Objectives (SLOs) & Error Budget Guide

## 1. Production SLOs & Service Level Indicators (SLIs)
| Service Workflow | Target Availability | Latency Target | SLI Definition | Monthly Error Budget |
| :--- | :---: | :---: | :--- | :---: |
| Global API Gateway | 99.9% | P95 < 200ms | Successful 2xx/3xx HTTP requests | 43.2 minutes |
| Authentication & MFA | 99.95% | P95 < 150ms | Successful login / verify endpoints | 21.6 minutes |
| Job & People Search | 99.5% | P95 < 300ms | Fast search responses (OS or Fallback) | 216 minutes |
| Notification Dispatch | 99.5% | Delivery < 30s | Successful in-app / push dispatches | 216 minutes |
