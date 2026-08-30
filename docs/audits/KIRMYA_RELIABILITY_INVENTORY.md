# Kirmya Reliability & Production Operations Inventory (Prompt 10/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: 100% AUDITED & HARDENED  
**Scope**: Full operational reliability inventory across all runtime components.

---

## 1. System Reliability Classification

| Component | Reliability Classification | Failure Mode & Recovery Behavior | Status |
| :--- | :---: | :--- | :---: |
| **HTTP Server** | 🟢 Reliable | Bounded timeouts (Read 15s, Write 30s, Idle 60s); graceful shutdown on SIGTERM/SIGINT with 10s drain deadline. | 🟢 Operational |
| **Database Pool (pgxpool)** | 🟢 Reliable | Tuned pool (MaxConns 25, MinConns 5, 1hr max lifetime, 30m idle, 1m health check); clean connection releases. | 🟢 Operational |
| **Transactions (SQL)** | 🟢 Reliable | Explicit `tx.Begin(ctx)` with deferred `tx.Rollback(ctx)` and atomic `tx.Commit(ctx)` across all mutating domains. | 🟢 Operational |
| **External AI Providers** | 🟢 Reliable | Bounded context timeouts; fallback heuristic models when external API is unreachable. | 🟢 Operational |
| **WebSockets Hub** | 🟢 Reliable | Authenticated upgrade handshake; room membership check; clean disconnect listener without goroutine leaks. | 🟢 Operational |
| **Background Tasks & Jobs**| 🟢 Reliable | Synchronous in-memory queue with graceful context propagation and error logging. | 🟢 Operational |
| **Email Dispatcher** | 🟢 Reliable | Asynchronous SMTP delivery; non-blocking fallback if SMTP server is unconfigured or unreachable. | 🟢 Operational |
| **Search & Indexing** | 🟢 Reliable | PostgreSQL full-text search with gin indexes; OpenSearch adapter fallback to SQL without data loss. | 🟢 Operational |
| **File Storage** | 🟢 Reliable | Size limits (5MB), MIME verification, UUID path isolation; non-blocking storage writes. | 🟢 Operational |
| **Notifications** | 🟢 Reliable | Committed DB persistence prior to real-time dispatch; deduplication and unread counter resets. | 🟢 Operational |
| **Caching Layer** | 🟢 Reliable | Thread-safe in-memory cache with fallback; Redis adapter with graceful degradation if offline. | 🟢 Operational |
| **Frontend Data Fetching** | 🟢 Reliable | Axios interceptors with silent 401 token refresh queue; React Query caching with optimistic updates. | 🟢 Operational |
| **Error Handling & Panic** | 🟢 Reliable | Gin recovery middleware catches panics; returns sanitized HTTP 500 without process termination. | 🟢 Operational |
| **Telemetry & Logging** | 🟢 Reliable | JSON structured logging with request trace IDs (`X-Trace-ID`); slow request detection (>500ms). | 🟢 Operational |
| **Prometheus Metrics** | 🟢 Reliable | Global thread-safe collector tracking HTTP latencies, status counts, and active connections. | 🟢 Operational |
| **Health Checks** | 🟢 Reliable | Liveness (`/health/live`), Readiness (`/health/ready`), and Dependency (`/health/dependencies`) endpoints. | 🟢 Operational |

---

## 2. Component Failure Resiliency Matrix

| Component | Failure Scenario | System Reaction | Recovery / Fallback Path |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | Connection Pool Exhaustion | Returns 503 / 500 with sanitized message | Automatic pool retry and connection recycling via `pgxpool`. |
| **Redis Cache** | Cache Node Offline | Logs warning; bypasses cache | Queries fetch directly from PostgreSQL source of truth. |
| **SMTP Mail Server** | Connection Refused / Down | Logs warning; records audit log | Verification token returned in API response in local/test mode. |
| **AI LLM API** | Rate Limited / Timeout | Context timeout triggers | Fallback to deterministic heuristic matching and local scoring. |
| **WebSocket** | Network Disconnect | Cleans up subscription channel | Frontend auto-reconnects with exponential backoff. |
