# Kirmya CI/CD Pipeline Automation & Quality Gates

## 1. Automated GitHub Actions Workflow
```
[Git Push / PR] ──► [Go Vet & Format] ──► [Go Tests & Golden] ──► [Vitest & Next Build] ──► [Trivy Security Scan] ──► [Deploy]
```

---

## 2. Release & Versioning Strategy
- Semantic versioning (`vMAJOR.MINOR.PATCH`) applied via signed Git tags.
- Pull requests require 100% test pass (`go test ./...`, `npx vitest run`, `npx tsc --noEmit`) prior to branch merge.
