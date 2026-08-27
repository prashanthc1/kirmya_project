# Kirmya Pre-Release Quality Checklist & Smoke Testing

## 1. Release Candidate Validation Checklist
- [x] Go Unit & Integration Tests: `go test ./...` (100% Pass).
- [x] Router Golden File Snapshots: `go test ./internal/router/...` (Pass).
- [x] Vitest Component & Unit Tests: `npx vitest run` (100% Pass).
- [x] TypeScript Static Check: `npx tsc --noEmit` (0 Errors).
- [x] Next.js Production Build: `npm run build` (Exit Code 0).
- [x] Post-Deployment Health Check: `GET /health/readiness` (200 OK).
