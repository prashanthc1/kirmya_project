# Kirmya Observability, Diagnostics, Reliability & Operational Runbook

## 1. Observability Architecture Overview

The Kirmya Platform integrates telemetry, structured JSON logging, distributed tracing (OpenTelemetry), and multi-tier health monitoring across modular monolith backend services and background workers.

```
Incoming Request / WebSocket
        │ (X-Correlation-ID Injection)
        ▼
HTTP Telemetry & Logging Middleware
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
Structured Logs (JSON)         OpenTelemetry Spans           System Health Service
(Redacted PII / Credentials)   (HTTP, DB, Worker Traces)     (/health/live, /ready, /startup)
```

---

## 2. Health & Readiness Probes

Kirmya provides standardized probe endpoints adhering to Kubernetes and container orchestration specifications:

| Endpoint | Probe Type | Purpose | HTTP Status |
| :--- | :--- | :--- | :--- |
| `/health/live` | Liveness | Verifies Go runtime process is active | `200 OK` |
| `/health/ready` | Readiness | Verifies database connectivity and traffic serving ability | `200 OK` / `503 Unavailable` |
| `/health/startup` | Startup | Verifies initialization and configuration bootstrap | `200 OK` |
| `/health/status` | Public Status | Sanitized component status summary for external consumers | `200 OK` |
| `/api/v1/admin/system/health` | Diagnostic | Deep diagnostic telemetry for authenticated administrators | `200 OK` (Admin RBAC) |

---

## 3. Dependency Criticality & Fallback Matrix

| Dependency | Classification | Failure / Unset Behavior | Fallback Strategy |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | **Critical** | Service marks readiness `503 Unavailable` | Reconnection retry with exponential backoff |
| **Redis** | **Optional** | Cache miss / bypass | Direct PostgreSQL transactional query path |
| **NATS / Bus** | **Optional** | Distributed pub/sub disabled | In-process concurrent event dispatch channel |
| **OpenSearch** | **Optional** | Clustered search unavailable | PostgreSQL GIN & Trigram (`pg_trgm`) fallback |
| **OpenTelemetry** | **Optional** | Traces not exported | Graceful no-op; zero application disruption |
| **AI Provider** | **Optional** | External LLM unavailable | Rule-based keyword matching & local scoring |

---

## 4. Structured Logging Standard & Secret Redaction

All operational logs enforce strict JSON formatting with automatic credential stripping:
- **Redacted Fields**: `password`, `token`, `access_token`, `refresh_token`, `authorization`, `secret`, `api_key`, `cvv`, `credit_card`.
- **PII Minimization**: Candidate home addresses, raw phone numbers, and full message bodies are excluded from default request logs.
- **Trace Context**: Request Correlation IDs (`X-Correlation-ID`) and OpenTelemetry Trace IDs are injected into log contexts.

---

## 5. Graceful Shutdown Protocol

Upon receiving `SIGTERM` or `SIGINT`:
1. **Listener Cessation**: Stop accepting new inbound HTTP requests.
2. **In-Flight Drain**: Allow active HTTP handlers up to 10 seconds to finish.
3. **WebSocket Hub Closure**: Broadcast graceful closure frames and cleanly terminate client reader/writer goroutines.
4. **Worker Termination**: Stop background queue consumers and await task completion.
5. **Connection Drain**: Flush OpenTelemetry spans and close PostgreSQL connection pools (`pgxpool.Close()`).

---

## 6. Recommended Production Alerting Thresholds

1. **High 5xx Rate**: 5xx HTTP responses $> 1\%$ over a 5-minute rolling window.
2. **Database Pool Saturation**: PostgreSQL active connection pool $> 85\%$ capacity for $\ge 3$ minutes.
3. **Elevated Latency**: P95 API response latency $> 500\text{ms}$ or P99 $> 1500\text{ms}$.
4. **Worker Queue Backlog**: Background job queue depth $> 500$ unprocessed tasks.
5. **Authentication Threat Spike**: Failed login bursts $> 20$ attempts/min from single IP subnet.
