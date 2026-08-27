# Kirmya Test Data Management & Synthetic Fixtures

## 1. Test Data Isolation Principles
- **No Production Data**: Synthetic data factories (`test/factories`) populate test accounts, jobs, and communities with mock data.
- **Deterministic Teardown**: Each integration test suite executes inside a rollback database transaction or executes `TRUNCATE` cleanup after completion to ensure zero cross-test state leakage.

---

## 2. Test Commands Reference

```bash
# Go Backend Unit & Integration Tests
go test -v ./...

# Go Race Detector
go test -race ./...

# Frontend Component & API Tests
npx vitest run

# TypeScript Type Check
npx tsc --noEmit

# Router Golden Table Validation
$env:KIRMYA_UPDATE_GOLDEN="1"; go test ./internal/router/...
```
