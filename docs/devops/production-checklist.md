# Kirmya Pre-Flight Production Readiness Checklist

## Pre-Release Verification
- [x] All automated tests pass: `go test ./...` and `npx vitest run`.
- [x] TypeScript build compiles with zero errors: `npx tsc --noEmit`.
- [x] Production Next.js build succeeds: `npm run build`.
- [x] Gin router golden route snapshots verified: `go test ./internal/router/...`.
- [x] Security scan complete: no critical dependency or container CVEs.
- [x] Database migrations verified for backward compatibility.
- [x] Environment variables populated in target deployment environment.
- [x] Health checks verified (`/health/liveness`, `/health/readiness`).
