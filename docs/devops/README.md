# Kirmya DevOps, CI/CD, Containerization & Operations Hub

Welcome to the DevOps Architecture, CI/CD Pipelines, Zero-Downtime Deployment Runbooks, and Rollback Procedures for Kirmya.

## Documentation Index

- [`devops-audit.md`](devops-audit.md): Complete DevOps posture audit and infrastructure components inventory.
- [`infrastructure-architecture.md`](infrastructure-architecture.md): Multi-tier cloud hosting topology across Vercel, Railway, and Cloudflare.
- [`architecture.md`](architecture.md): Infrastructure diagram, network boundaries, and service dependency graph.
- [`environments.md`](environments.md): Environment definitions, resource allocation, and promotion lifecycle.
- [`environment-management.md`](environment-management.md): Configuration isolation, database separation, and secrets management.
- [`ci-cd.md`](ci-cd.md): GitHub Actions multi-stage CI/CD pipeline, automated testing, and security gates.
- [`release-checklist.md`](release-checklist.md): Pre-deployment verification checklist and quality gates.
- [`deployment.md`](deployment.md): Zero-downtime rolling update mechanics and database migration sequencing.
- [`deployment-runbook.md`](deployment-runbook.md): Step-by-step rolling deployment operating procedure.
- [`rollback-runbook.md`](rollback-runbook.md): Automated trigger signals and one-click rollback procedures.
- [`secrets.md`](secrets.md): Secret injection, encryption at rest, and zero-leakage policies.
- [`database-migrations.md`](database-migrations.md): Forward and backward migration validation and lock prevention.
- [`backup-restore.md`](backup-restore.md): Automated point-in-time recovery (PITR) and disaster restoration.
- [`disaster-recovery.md`](disaster-recovery.md): Business continuity, failover protocols, and RTO/RPO targets.
- [`incident-response.md`](incident-response.md): Incident severity matrix and blameless postmortem workflows.
- [`production-checklist.md`](production-checklist.md): 50-point operational excellence readiness checklist.
- [`service-dependency-map.md`](service-dependency-map.md): Critical runtime dependency graph and degradation modes.

### Runbooks (`runbooks/`)
- [`runbooks/api-outage.md`](runbooks/api-outage.md): High error rates and container restart runbook.
- [`runbooks/database-outage.md`](runbooks/database-outage.md): PostgreSQL connection exhaustion and failover runbook.
- [`runbooks/deployment-rollback.md`](runbooks/deployment-rollback.md): Emergency deployment rollback runbook.
