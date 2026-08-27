# Kirmya DevOps, Infrastructure & Release Management Documentation Hub

Welcome to the DevOps, CI/CD Pipelines, Multi-Stage Container Builds, Secrets Management, and Disaster Recovery documentation for Kirmya.

## Documentation Index

- [`devops-audit.md`](devops-audit.md): Complete audit of containerization, CI/CD gates, and infrastructure topology.
- [`architecture.md`](architecture.md): Multi-stage container builds, distroless runtimes, and health probes.
- [`environments.md`](environments.md): Environment matrix across Local, Staging, and Production tiers.
- [`ci-cd.md`](ci-cd.md): GitHub Actions automation, quality gates, and semantic release versioning.
- [`deployment.md`](deployment.md): Zero-downtime deployment workflows on Railway, Vercel, and Cloudflare.
- [`secrets.md`](secrets.md): Secrets management policy, runtime injection, and environment security.
- [`database-migrations.md`](database-migrations.md): Forward-compatible migrations and advisory locking.
- [`backup-restore.md`](backup-restore.md): Automated PostgreSQL PITR archiving and monthly restore drills.
- [`disaster-recovery.md`](disaster-recovery.md): DR objectives (RPO < 15m, RTO < 60m) and regional failover.
- [`incident-response.md`](incident-response.md): Severity classifications (SEV-1 to SEV-3) and blameless RCA templates.
- [`production-checklist.md`](production-checklist.md): Pre-flight release verification checklist.
- [`service-dependency-map.md`](service-dependency-map.md): System dependencies, criticality, and graceful fallbacks.

### Operations Runbooks (`runbooks/`)
- [`api-outage.md`](runbooks/api-outage.md): Triage and remediation for API outages.
- [`database-outage.md`](runbooks/database-outage.md): PostgreSQL connection exhaustion and failover runbook.
- [`deployment-rollback.md`](runbooks/deployment-rollback.md): Rapid rollback protocols for Railway and Vercel.
