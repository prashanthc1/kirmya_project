<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F06 (Production frontend CI supplies an incompatible API base URL); F11 (Database-free CI is mistaken for full workflow validation); F12 (Security workflow deliberately suppresses scan failures); F18 (Production can enter unregistered nil-database fallback mode); F19 (Frontend release check currently fails at linting).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

# Kirmya Infrastructure Audit & Network Boundaries

## Executive Summary
This document provides a comprehensive audit of the production topology, network segmentation, Docker container hardening, port exposure, reverse proxy setup, and Cloudflare CDN integration for Kirmya.

---

## 1. Production Topology & Component Classification

```
                  ┌─────────────────────────────────────────┐
                  │   Internet / Public Traffic Entry       │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │    Cloudflare DNS / WAF / CDN Edge      │ (Public)
                  └────────────────────┬────────────────────┘
                                       │ (HTTPS / TLS 1.3)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │  Application Load Balancer / Nginx LB   │ (Public Ingress)
                  └──────────┬───────────────────┬──────────┘
                             │                   │
               ┌─────────────▼──────┐     ┌──────▼─────────────┐
               │ Next.js Frontend   │     │  Go Backend API    │ (App Network)
               │ (Port 3000)        │     │  (Port 8080)       │
               └────────────────────┘     └──────┬─────────────┘
                                                 │
                                 ┌───────────────┴───────────────┐
                                 │ Private Service & Data Network│
                                 ├───────────────┬───────────────┤
                                 │ PostgreSQL    │ Redis (6379)  │ (Private Network)
                                 │ (5432)        │ (AOF + Pass)  │
                                 ├───────────────┼───────────────┤
                                 │ OpenSearch    │ OTEL Collector│
                                 │ (9200)        │ (4317 / 4318) │
                                 └───────────────┴───────────────┘
```

---

## 2. Network Boundaries & Port Audit

| Service / Container | Network Domain | Exposed Publicly? | Allowed Traffic Sources | Port Mapping | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Next.js Frontend** | App Network | **Yes** | Cloudflare Edge / Public HTTP(S) | `3000:3000` | Web UI & SSR rendering |
| **Go Backend API** | App Network | **Yes** | ALB / Frontend / Reverse Proxy | `8080:8080` | REST API, WebSockets, Telemetry |
| **PostgreSQL Database** | Data Network | **No** (Private) | Go Backend Containers | `5432` (Internal) | Primary relational database |
| **Redis Cache** | Data Network | **No** (Private) | Go Backend Containers | `6379` (Internal) | Session store & cache layer |
| **OpenSearch** | Data Network | **No** (Private) | Backend Search Services | `9200` (Internal) | Log aggregation & search engine |
| **OpenTelemetry Collector**| App Network | **No** (Private) | Backend / Frontend Telemetry | `4317`, `4318` (Internal) | Traces and Prometheus metrics |

---

## 3. Storage & Persistence Security

- **PostgreSQL Volume**: Bound to persistent volume `postgres_prod_data`. Direct host container mounts are isolated.
- **Redis Volume**: Bound to persistent volume `redis_prod_data` with `--appendonly yes` and password authentication (`--requirepass`).
- **Log Management**: Application container logs output structured JSON to stdout/stderr, collected via Docker log driver with 10MB max size and 3 file rotations.
