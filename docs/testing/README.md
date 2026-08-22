# Kirmya Quality Engineering Documentation

Welcome to the Quality Engineering and Test Infrastructure documentation for Kirmya.

## Documentation Index

- [`testing-audit.md`](testing-audit.md): Full audit of test frameworks, coverage, and suite breakdowns.
- [`testing-strategy.md`](testing-strategy.md): Testing pyramid, core testing principles, and isolation practices.
- [`critical-paths.md`](critical-paths.md): Critical business workflows and test coverage matrix.
- [`ci-quality-gates.md`](ci-quality-gates.md): CI/CD pipeline quality gates, release validation, and build checks.

## Quick Execution Commands

### Backend Tests
```bash
# Run all Go backend unit & integration tests
go test ./...

# Run Gin router golden snapshot tests
$env:KIRMYA_UPDATE_GOLDEN="1"; go test ./internal/router/...

# Build Go backend binaries
go build ./...
```

### Frontend Tests
```bash
# Run all Vitest frontend unit & component tests (37 files / 423 tests)
npx vitest run

# Run TypeScript type safety check
npx tsc --noEmit

# Run Next.js production build check
npm run build
```
