# Kirmya Observability, SRE & Reliability Engineering Documentation Hub

Welcome to the Observability Architecture, Three Pillars of Telemetry (Logs, Metrics, Traces), Service-Level Objectives (SLOs), Service Catalog, Incident Management, and SRE Runbooks for Kirmya.

## Documentation Index

- [`observability-audit.md`](observability-audit.md): Complete audit of telemetry pipelines, OpenTelemetry instrumentation, and PII protection.
- [`observability-architecture.md`](observability-architecture.md): Telemetry architecture and unified data flow across frontend and backend.
- [`architecture.md`](architecture.md): Service telemetry topology across HTTP, database, cache, and NATS event bus layers.
- [`service-catalog.md`](service-catalog.md): Platform microservices directory, owners, health endpoints, and 30-day SLOs.
- [`runbook-index.md`](runbook-index.md): Master index of all SRE operational and subsystem failure runbooks.
- [`logging.md`](logging.md): Structured JSON logging formats, log levels, and automated PII redaction engine.
- [`metrics.md`](metrics.md): Prometheus metric definitions, counters, histograms, and cardinality management.
- [`tracing.md`](tracing.md): OpenTelemetry distributed tracing, W3C context propagation, and sampling policies.
- [`alerts.md`](alerts.md): Severity classification (P1 to P4), alerting rules, and on-call notification routing.
- [`dashboards.md`](dashboards.md): Standard Grafana dashboard catalog for API, database, and background workers.
- [`slo.md`](slo.md): 30-day rolling SLO targets, Service Level Indicators (SLIs), and error budgets.
- [`incident-management.md`](incident-management.md): SRE incident lifecycle (Detection, Triage, Mitigation, Resolution, Postmortem).
- [`postmortem-template.md`](postmortem-template.md): Standardized blameless incident postmortem template with 5 Whys analysis.

### Operational Runbooks (`runbooks/`)
- [`api-outage.md`](runbooks/api-outage.md): Triage and remediation for API outages and latency spikes.
- [`database-outage.md`](runbooks/database-outage.md): PostgreSQL connection exhaustion and failover runbook.
- [`redis-outage.md`](runbooks/redis-outage.md): Redis cluster partition, memory eviction spikes, and cache rebuilds.
- [`nats-outage.md`](runbooks/nats-outage.md): NATS JetStream consumer lag and idempotent message replay.
- [`opensearch-outage.md`](runbooks/opensearch-outage.md): OpenSearch cluster unavailability and fallback to PostgreSQL GIN indexes.
- [`worker-backlog.md`](runbooks/worker-backlog.md): Background worker lag and NATS queue saturation runbook.
- [`external-provider-outage.md`](runbooks/external-provider-outage.md): External email and AI provider outage mitigations.
