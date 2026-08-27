# Kirmya Production Release Validation & Post-Deployment Smoke Suite

## 1. Post-Deployment Automated Smoke Suite
Following every production release or canary deployment, an automated smoke test suite verifies:
- `/healthz` & `/api/v1/system/health` return HTTP 200 OK.
- Database connectivity & migration schema version matching.
- Synthetic candidate login & public job discovery search.
- OpenSearch index status & NATS event bus ping.

---

## 2. Release Gate Checklist

- [x] Go Unit & Integration Tests (100% Pass)
- [x] Frontend Vitest Unit Tests (100% Pass)
- [x] TypeScript Check (`npx tsc --noEmit` - 0 Errors)
- [x] Gin Router Golden File Snapshot Validation
- [x] Security Vulnerability & Dependency Audits
- [x] Production Next.js Build Succeeded
