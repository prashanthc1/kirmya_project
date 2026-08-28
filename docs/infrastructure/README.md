# Kirmya Infrastructure, DevOps, CI/CD & SRE Platform Hub

Welcome to the Cloud Infrastructure, Docker Orchestration, GitHub Actions CI/CD, OpenTelemetry Observability, and SRE Runbooks for Kirmya.

## Documentation Index

- [`infrastructure-audit.md`](infrastructure-audit.md): Comprehensive audit of deployment targets, container hardening, and cluster reliability.
- [`production-architecture.md`](production-architecture.md): Multi-tier production topology across Cloudflare, Vercel, Railway, and PostgreSQL.
- [`environment-configuration.md`](environment-configuration.md): Environment variable catalog, classification levels, and secret management.
- [`devops-guide.md`](devops-guide.md): Local development setup, Docker Compose stack, and distroless container builds.
- [`deployment-guide.md`](deployment-guide.md): Zero-downtime deployment pipelines, Canary rollouts, and migration sequencing.
- [`ci-cd-guide.md`](ci-cd-guide.md): GitHub Actions CI pipelines, automated quality gates, and golden route testing.
- [`observability-guide.md`](observability-guide.md): OpenTelemetry context propagation, OTLP collectors, and privacy-scrubbed spans.
- [`logging-guide.md`](logging-guide.md): Structured JSON logging format, PII redaction middleware, and log lifecycle rules.
- [`metrics-guide.md`](metrics-guide.md): Prometheus golden signals (Rate, Errors, Duration, Saturation) and latency histograms.
- [`tracing-guide.md`](tracing-guide.md): Distributed tracing across Gin, PostgreSQL, Redis, NATS, and Next.js frontend.
- [`monitoring-guide.md`](monitoring-guide.md): Health check semantics (`/healthz`, `/readyz`), alerting rules, and paging thresholds.
- [`slo-guide.md`](slo-guide.md): Service Level Objectives (SLOs), Service Level Indicators (SLIs), and error budgets.
- [`backup-guide.md`](backup-guide.md): Automated PostgreSQL snapshots, continuous WAL archiving, and restore drill automation.
- [`capacity-planning.md`](capacity-planning.md): Resource allocation, CPU/RAM sizing, and autoscaling thresholds.
- [`performance-guide.md`](performance-guide.md): Core Web Vitals targets, bundle optimization, and backend latency budgets.
- [`on-call-guide.md`](on-call-guide.md): SRE on-call rotations, primary/secondary escalation, and incident commander roles.
- [`runbooks/README.md`](runbooks/README.md): Comprehensive incident mitigation runbooks for database, search, and queue failures.
