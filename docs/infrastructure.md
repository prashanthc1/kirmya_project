# Kirmya Production Infrastructure, Containerization & Orchestration Guide

## 1. Production Topology & Architecture

The Kirmya Platform utilizes a modular container topology engineered for rapid local development and scalable production cloud hosting.

```
Client (Web / Mobile)
        │ (HTTPS / TLS 1.3)
        ▼
Reverse Proxy / Ingress (CORS, Rate Limiting, SSL Termination)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
Next.js Frontend Container     Go Backend Container          OTEL Collector
(Port 3000 / Non-Root)        (Port 8080 / Non-Root)        (Port 4317 / 4318)
        │                             │
        │                             ├──────────────┬──────────────┬──────────────┐
        ▼                             ▼              ▼              ▼              ▼
PostgreSQL Primary DB          Redis Cache     NATS Event    OpenSearch     Object Storage
(Port 5432 / Persistent)      (Port 6379)     (Port 4222)   (Port 9200)    (S3 / Private)
```

---

## 2. Docker & Container Security Specifications

### 2.1 Backend Containerization (`backend/Dockerfile`)
- **Base Image**: `golang:1.26-alpine` (Build stage) $\rightarrow$ `alpine:3.20` (Runtime stage).
- **Execution Privileges**: Unprivileged system user `appuser` (UID 10001).
- **Health Checks**: Built-in container health probe evaluating `/health/live`.
- **Signal Handling**: `SIGTERM` and `SIGINT` signals intercepted for graceful connection draining.

### 2.2 Frontend Containerization (`frontend/Dockerfile`)
- **Base Image**: `node:20-alpine` (Build stage) $\rightarrow$ `node:20-alpine` (Runtime stage).
- **Standalone Engine**: Uses Next.js standalone output (`output: 'standalone'`).
- **Execution Privileges**: Unprivileged system user `nextjs` (UID 1001).

---

## 3. Graceful Infrastructure Degradation Matrix

| Infrastructure Service | Classification | Online Mode | Offline / Disabled Mode |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | **Critical** | Persistent transactional queries | Service marks readiness `503 Unavailable` |
| **Redis** | **Optional** | L1 cache & session store | Direct PostgreSQL query fallback |
| **NATS Bus** | **Optional** | Distributed cluster event pub/sub | In-process concurrent Go event channels |
| **OpenSearch** | **Optional** | Clustered vector/BM25 search | PostgreSQL GIN & Trigram (`pg_trgm`) fallback |
| **OTEL Collector** | **Optional** | Distributed trace export | In-memory no-op; zero application impact |
| **AI Provider** | **Optional** | External LLM generation | Local heuristic & keyword matching |

---

## 4. Resource Limits & Port Security

- **Internal Network Isolation**: Database (`5432`), Redis (`6379`), and OpenSearch (`9200`) ports are shielded behind internal Docker bridge networks in production and not exposed to the public internet.
- **Memory & File Descriptor Bounds**: Container memory limits configured (`--maxmemory 256mb` on Redis, `512m` heap on OpenSearch, `nofile: 65536`).
