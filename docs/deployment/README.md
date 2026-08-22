# Kirmya Release Engineering & Deployment Documentation

Welcome to the Release Engineering, CI/CD, and Production Deployment documentation for Kirmya.

## Documentation Index

- [`cicd-audit.md`](cicd-audit.md): Complete audit of workflows, Dockerfiles, and container configurations.
- [`environment-strategy.md`](environment-strategy.md): Environment tiers, isolation rules, and secret hygiene.
- [`cicd.md`](cicd.md): Pipeline flow, quality gates, and immutable image tagging strategy.
- [`docker.md`](docker.md): Multi-stage Docker builds, security hardening, and resource allocation.
- [`migrations.md`](migrations.md): Expand/Contract schema migration protocol and safety checks.
- [`rollback.md`](rollback.md): Automated rollback triggers, execution steps, and traffic re-routing.
- [`release-process.md`](release-process.md): End-to-end release lifecycle and post-deployment observation.
- [`release-checklist.md`](release-checklist.md): Pre-flight deployment checklist and quality verification.
- [`deployment-runbook.md`](deployment-runbook.md): Step-by-step SRE deployment runbook.
- [`production-readiness.md`](production-readiness.md): Production readiness assessment and operational proof.

## Core Deployment Commands

### Local Docker Stack
```bash
docker-compose up -d
```

### Production Stack Orchestration
```bash
docker-compose -f docker-compose.production.yml up -d
```
