# Kirmya Platform Service Catalog & Ownership Directory

## 1. Production Micro-Services & Subsystems

| Service Name | Primary Owner | Health Endpoint | Target 30-Day SLO | Primary Runbook |
| :--- | :--- | :--- | :--- | :--- |
| **Auth & Security** | Core Backend | `GET /health/liveness` | 99.99% Availability | [`docs/security/incident-response.md`](../security/incident-response.md) |
| **Job Board & ATS** | Careers Team | `GET /api/v1/jobs/health` | 99.9% Availability | [`docs/observability/runbooks/api-outage.md`](runbooks/api-outage.md) |
| **Communities Hub** | Community Team | `GET /api/v1/communities/health` | 99.5% Availability | [`docs/observability/runbooks/api-outage.md`](runbooks/api-outage.md) |
| **Notifications** | Platform Team | `GET /api/v1/notifications/health` | 99.9% Delivery | [`docs/observability/runbooks/worker-backlog.md`](runbooks/worker-backlog.md) |
| **OpenSearch Engine** | Search Team | `GET /health/readiness` | 99.0% P95 < 120ms | [`docs/observability/runbooks/opensearch-outage.md`](runbooks/opensearch-outage.md) |
| **NATS Event Bus** | Infra SRE | Internal JetStream Monitor | 99.95% Durability | [`docs/observability/runbooks/nats-outage.md`](runbooks/nats-outage.md) |
