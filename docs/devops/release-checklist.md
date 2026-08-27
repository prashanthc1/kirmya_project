# Kirmya Production Release Readiness Checklist

## 1. Pre-Deployment Verification Gates
- [x] **Go Backend Test Suite**: `go test ./...` passes 100% across all packages.
- [x] **Router Golden Snapshots**: `go test ./internal/router/...` route tree matches snapshot.
- [x] **Frontend Vitest Suite**: `npx vitest run` passes 100% (37 suites / 423 tests).
- [x] **TypeScript Strict Check**: `npx tsc --noEmit` returns 0 compilation errors.
- [x] **Production Next.js Build**: `npm run build` succeeds cleanly.
- [x] **Vulnerability Scans**: `govulncheck` and `npm audit --audit-level=high` clean.
- [x] **Database Migration Safety**: Migrations tested forward and backward in staging.
