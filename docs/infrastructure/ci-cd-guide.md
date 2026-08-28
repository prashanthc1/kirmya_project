# Kirmya Continuous Integration & Automated Quality Gates Guide

## 1. GitHub Actions CI/CD Pipeline
- **Parallel Quality Verification**: Concurrent execution of Go unit/integration tests, Vitest React suites, and TypeScript `tsc --noEmit`.
- **Security & Secret Scanning**: Automated secret detection (TruffleHog/Gitleaks) and dependency vulnerability audits (npm audit, govulncheck).
- **Golden Router Checks**: Route snapshot validation ensures API contracts remain strictly backward-compatible.
