# Kirmya CI/CD Pipeline & Automated Release Engineering

## Pipeline Flow

```
[ Developer Commit ]
        │
        ▼
[ GitHub Actions PR Gate ] ──► (1. Static Analysis & Linting)
        │                  ──► (2. Go & Vitest Unit/Integration Tests)
        │                  ──► (3. Security & Dependency Vulnerability Scan)
        │                  ──► (4. OpenAPI & Router Golden Snapshot Test)
        ▼
[ Merge to `main` ]
        │
        ▼
[ Staging Build & Deploy ] ──► (Build Immutable Containers tagged with Commit SHA)
        │                  ──► (Run Database Migrations on Staging DB)
        │                  ──► (Execute Staging Smoke & Integration Tests)
        ▼
[ Production Release Gate ] ──► (Requires SRE & Engineering Manager Approval)
        │
        ▼
[ Production Blue-Green Deploy ] ──► (Zero-Downtime Rollout & Healthcheck Validation)
```

## Immutable Image Tagging
All production container images are tagged with the immutable Git commit SHA (`kirmya-backend:${GITHUB_SHA}`). Re-using mutable tags (e.g. `:latest`) in production deployment manifests is prohibited.
