# Kirmya Dependency & Supply Chain Security

## 1. Automated Vulnerability Scanning
- **Go Vulnerabilities**: `govulncheck` scans all backend dependencies in GitHub Actions CI pipelines.
- **Node.js Dependencies**: `npm audit --audit-level=high` gates frontend production builds.
- **Container Base Images**: Trivy scans Alpine container images for CVEs prior to image registry pushes.
