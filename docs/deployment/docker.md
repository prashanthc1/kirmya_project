# Kirmya Docker Container & Image Hardening

## Container Security & Optimization Standards

1. **Multi-Stage Build Pattern**: Both backend and frontend Dockerfiles utilize multi-stage compilation to strip compilers, build tools, and raw source code from production runtime containers.
2. **Non-Root Execution**:
   - Backend container runs as system user `kirmya` (UID/GID created dynamically).
   - Frontend container runs as system user `nextjs:1001` (group `nodejs:1001`).
3. **Health Check Probes**:
   - Backend: `curl -f http://localhost:8080/api/v1/metrics` (interval 15s, timeout 5s, retries 3).
   - Frontend: `wget --spider http://localhost:3000/` (interval 15s, timeout 5s, retries 3).
4. **Log Allocation & Rotation**: Docker Compose production services enforce JSON file logging capped at `10m` max size and 3 file rotations to prevent host disk exhaustion.
