# Kirmya Production DevOps Architecture

## 1. Multi-Stage Container Specifications
- **Go 1.26 Backend**: Multi-stage `golang:1.26-alpine` build creating a minimal scratch/distroless runtime binary under 35MB.
- **Next.js 14 Frontend**: Multi-stage `node:20-alpine` build utilizing `output: "standalone"` for optimized container footprint.

---

## 2. Health Check & Observability Probes
- **Liveness Probe**: `GET /health/liveness` (returns 200 if HTTP listener is responsive).
- **Readiness Probe**: `GET /health/readiness` (verifies PostgreSQL connection pool, Redis reachability, and NATS event bus ping).
