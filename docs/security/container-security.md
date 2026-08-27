# Kirmya Container Security & Non-Root Hardening

## 1. Container Hardening Standards
- **Non-Root Execution**: Container processes run under non-root user `appuser` (UID 10001, GID 10001).
- **Read-Only Root Filesystem**: Temporary directories (`/tmp`) mounted with `noexec,nosuid,nodev`.
- **Capability Dropping**: All unnecessary Linux capabilities (`CAP_SYS_ADMIN`, `CAP_NET_RAW`) dropped from container manifests.
- **Trivy Image Scans**: Production container images scanned for CVEs before registry publication.
