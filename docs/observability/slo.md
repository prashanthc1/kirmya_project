# Kirmya Service-Level Objectives (SLOs) & Error Budgets

## 1. Production SLO Targets (30-Day Rolling Window)

| Service Area | Service Level Indicator (SLI) | SLO Target | Error Budget |
| :--- | :--- | :--- | :--- |
| **API Availability** | Successful HTTP requests (`status < 500`) / Total requests | 99.9% | 43.2 minutes downtime/month |
| **Job Search Latency** | HTTP `/api/v1/jobs` requests completed under 120ms | 99.0% | 1% of total requests |
| **Application Submission**| Successful job applications without server failure | 99.95% | 21.6 minutes downtime/month |
| **Direct Messaging** | Message dispatch latency under 50ms | 99.5% | 0.5% of total messages |
