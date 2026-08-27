# Kirmya Performance Audit & SLO Baselines

## Executive Summary
This document outlines the performance audit findings, SLO baselines, query optimization targets, connection pool configurations, and memory management strategies across Kirmya's Go backend, PostgreSQL database, Redis cache, OpenSearch cluster, NATS event bus, and Next.js frontend.

---

## 1. Latency SLOs & Targets

| Feature Area | Endpoint Scope | Target p50 | Target p95 | Target p99 | Max Error Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `/api/v1/auth/login`, `/token` | <= 45ms | <= 120ms | <= 250ms | <= 0.01% |
| **People Search** | `/api/v1/search/people` | <= 65ms | <= 180ms | <= 400ms | <= 0.05% |
| **Job Search** | `/api/v1/jobs` | <= 50ms | <= 150ms | <= 350ms | <= 0.05% |
| **Job Applications**| `/api/v1/applications` | <= 80ms | <= 200ms | <= 500ms | <= 0.01% |
| **Communities** | `/api/v1/communities` | <= 60ms | <= 160ms | <= 380ms | <= 0.05% |
| **Admin APIs** | `/api/v1/admin/*` | <= 90ms | <= 250ms | <= 600ms | <= 0.10% |

---

## 2. PostgreSQL Connection Pool Specification
- **Library**: `pgxpool`
- **Max Connections**: `25` per API instance (preventing DB connection starvation).
- **Min Connections**: `5` (pre-warmed idle connections).
- **Max Conn Lifetime**: `30 minutes`.
- **Max Conn Idle Time**: `5 minutes`.
- **Health Check Interval**: `1 minute` background ping.
