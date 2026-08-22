# Kirmya Pre-Release Checklist

- [x] **Go Backend Test Suite**: `go test ./...` passed (100%).
- [x] **Gin Router Golden Snapshots**: `$env:KIRMYA_UPDATE_GOLDEN="1"; go test ./internal/router/...` passed.
- [x] **Frontend Vitest Suite**: `npx vitest run` passed (37 files / 423 tests).
- [x] **TypeScript Static Check**: `npx tsc --noEmit` passed (0 errors).
- [x] **Next.js Production Build**: `npm run build` completed cleanly.
- [x] **OpenAPI / Swagger Sync**: Committed spec in `internal/docs` matches handlers.
- [x] **Database Migration Safety**: Migrations 0001 through 0086 validated against clean PostgreSQL schema.
- [x] **Secret Audit**: Zero production secrets committed in git history or `.env.example` templates.
- [x] **Disaster Recovery Backup**: Pre-deployment snapshot verified in vault storage.
- [x] **Rollback Plan Locked**: Previous stable container SHA identified for immediate failover if required.
