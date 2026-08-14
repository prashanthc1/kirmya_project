# Kirmya System Health, Diagnostics & Self-Healing Guide

## 1. Overview
Kirmya features an enterprise-grade system health probe framework, automated safe self-healing engine, circuit breakers, and platform maintenance mode control.

## 2. Health Probes & Endpoints
- **Liveness (`GET /health/live`)**: Lightweight process check. Returns `200 OK` if the Gin HTTP server is alive without probing database or external services.
- **Readiness (`GET /health/ready` & `GET /health`)**: Checks critical infrastructure (PostgreSQL pool). Returns `200 OK` if ready to serve traffic.
- **Startup (`GET /health/startup`)**: Validates startup configuration and database connectivity.
- **Public Status (`GET /status`)**: Returns high-level component status flags (`healthy`, `degraded`) without exposing internal hosts, IPs, or credentials.
- **Admin System Health Studio (`GET /api/v1/admin/system/health`)**: Full diagnostic matrix with component latencies, circuit breaker states (`closed`, `open`, `half_open`), active incident telemetry, and self-healing action triggers.

## 3. Self-Healing Safeguards
- Automated recovery actions: `restart_worker`, `reconnect_db_pool`, `clear_transient_cache`, `reconnect_event_bus`.
- Destructive database actions or backup restores are strictly forbidden from automated self-healing.
