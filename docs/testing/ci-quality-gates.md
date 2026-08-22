# Kirmya CI/CD Quality Gates & Release Validation

## Automated CI Pipeline Stages

```
1. Static Analysis     -> npx tsc --noEmit
2. Go Unit Tests       -> go test ./...
3. Router Golden Test  -> $env:KIRMYA_UPDATE_GOLDEN="1"; go test ./internal/router/...
4. Frontend Vitest     -> npx vitest run
5. Production Build    -> go build ./... && npm run build
```

## Quality Gate Standards
- **Zero Compilation Errors**: Go code and TypeScript frontend must build with 0 warnings/errors.
- **100% Test Pass Rate**: All 423 Vitest tests and all Go backend unit/integration tests must pass cleanly.
- **Zero Compromised Data**: Synthetic test data only; zero PII or credentials logged.
- **Swagger/OpenAPI Sync**: Gin router golden snapshot tests guarantee API route registration alignment.
