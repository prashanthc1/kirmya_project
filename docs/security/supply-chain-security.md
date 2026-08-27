# Kirmya Supply-Chain Security & Dependency Assurance

## 1. Automated Dependency Scanning Pipeline
- **Go Backend Dependencies**: `govulncheck ./...` executed on every pull request to detect known Go security vulnerabilities.
- **Node.js Frontend Dependencies**: `npm audit --audit-level=high` blocks production builds with critical CVEs.
- **Dependency Pinning**: Strict pinning in `go.sum` and `package-lock.json` with cryptographic hash verification.
