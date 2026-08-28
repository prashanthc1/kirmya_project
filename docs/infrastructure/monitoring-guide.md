# Kirmya Alerting Rules & SRE Health Monitoring Manual

## 1. Alerting Rules & Health Check Semantics
- **Liveness Probes**: `/api/v1/healthz` checks process vitality; does not fail if external dependencies are transiently degraded.
- **Readiness Probes**: `/api/v1/readyz` verifies PostgreSQL and Redis availability before allowing traffic routing.
- **Critical Alert Triggers**: P95 latency > 500ms for 3m, 5xx error rate > 1% for 2m, or queue backlog > 1,000 items.
