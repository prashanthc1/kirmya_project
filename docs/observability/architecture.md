# Kirmya Observability Architecture & Telemetry Pipeline

## 1. Multi-Tier Telemetry Components
- **HTTP Ingress Layer**: Gin middleware instruments every request with `request_id`, status code, duration histogram, and W3C trace span.
- **Data & Cache Layer**: OpenTelemetry span hooks on `pgxpool` queries and Redis client operations.
- **Event Bus Layer**: NATS message header propagation maintaining distributed trace continuity across asynchronous worker pools.
