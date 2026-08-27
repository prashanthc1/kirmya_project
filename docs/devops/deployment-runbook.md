# Kirmya Zero-Downtime Deployment Runbook

## 1. Rolling Deployment Protocol
1. Merge reviewed pull request to `main` branch.
2. GitHub Actions executes automated CI quality gates (lint, test, security, build).
3. Docker image built and published with immutable commit SHA tag.
4. Database migrations applied automatically before backend container rolling update.
5. Readiness probe (`GET /health/readiness`) verified on newly spawned containers.
6. In-flight requests drained gracefully from old instances over 30-second window.
