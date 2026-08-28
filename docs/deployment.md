# Kirmya Deployment, CI/CD, Containerization & Disaster Recovery Guide

## 1. CI/CD Architecture

Kirmya utilizes automated GitHub Actions workflows for continuous integration, code quality, static security scans, and container builds:
- `.github/workflows/backend.yml`: Go compile, test pass (`go test ./...`), `go vet`, Swagger route golden verification, and Docker backend image build.
- `.github/workflows/frontend.yml`: Node.js dependency check, TypeScript check (`tsc --noEmit`), Vitest suite pass (`npx vitest run`), Next.js production build (`npm run build`), and Docker frontend image build.
- `.github/workflows/security.yml`: Gosec SAST security analysis and secret scanning.

---

## 2. Docker & Container Strategy

### 2.1 Backend Containerization (`backend/Dockerfile`)
- **Multi-Stage Build**: Compiles binary in `golang:1.26-alpine` and outputs a lightweight final runtime image using `alpine:3.20` or distroless.
- **Security**: Runs under non-root unprivileged user `appuser` (UID 10001).
- **Health Probes**: Built-in `HEALTHCHECK` probing `/health/live`.

### 2.2 Frontend Containerization (`frontend/Dockerfile`)
- **Standalone Build**: Outputs standalone Next.js production build (`output: 'standalone'`).
- **Security**: Runs under non-root unprivileged user `nextjs` (UID 1001).
- **Environment Isolation**: Private backend credentials are never embedded into frontend images.

---

## 3. Database Migration & Rollback Strategy

1. **Forward-Compatible Migrations**: Schema changes follow the `Expand ➔ Deploy ➔ Migrate ➔ Contract` paradigm to ensure zero downtime.
2. **Safe Rollback**:
   - Application binary/image can roll back immediately to the previous stable release.
   - Migrations avoid destructive operations (`DROP TABLE`, `DROP COLUMN`) within the same release cycle.

---

## 4. Disaster Recovery & Backup Plan

- **PostgreSQL Backups**: Daily automated snapshots with 30-day point-in-time recovery (PITR) retention.
- **Target RPO (Recovery Point Objective)**: $< 1\text{ hour}$.
- **Target RTO (Recovery Time Objective)**: $< 30\text{ minutes}$.
- **Recovery Drill**: Automated periodic restore verification testing database snapshot integrity.

---

## 5. Production Release Checklist

1. [ ] All backend unit & integration tests passing (`go test ./...`).
2. [ ] All frontend TypeScript and Vitest tests passing (`npx tsc --noEmit`, `npx vitest run`).
3. [ ] Database migrations tested on staging schema.
4. [ ] Environment configuration verified (`.env.example` audited).
5. [ ] Production secrets securely injected via container orchestration secrets manager.
6. [ ] Zero-downtime deployment executed with `/health/ready` probe validation.
7. [ ] Post-deployment smoke tests verified across Auth, Profile, Jobs, Messaging, and Communities.
