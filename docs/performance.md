# Kirmya Production Performance, Scalability & Capacity Engineering Guide

## 1. Performance Architecture & Latency Budgets

Kirmya enforces strict latency SLOs across its frontend and backend service architecture to guarantee high throughput and responsive user experience under peak load.

```
Client Interaction
        │ (p50 < 30ms / p95 < 80ms / p99 < 150ms)
        ▼
[HTTP Transport Pipeline] (Gin Router, Streaming JSON, Connection Pooling)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
In-Memory / Redis L1 Cache     pgxpool Connection Pool       OpenSearch / Trigram
(Hit Rate > 85% on Metadata)  (Max 25 / Min 5 per replica)  (Full-Text & Discovery)
```

---

## 2. Measurable Latency & Capacity Baselines

| Operation Category | Target p50 Latency | Target p95 Latency | Target p99 Latency | Tested Capacity |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Session Validation** | $< 15\text{ ms}$ | $< 35\text{ ms}$ | $< 60\text{ ms}$ | $5,000\text{ req/sec}$ |
| **Job Market Search & Discovery** | $< 25\text{ ms}$ | $< 65\text{ ms}$ | $< 120\text{ ms}$ | $2,500\text{ req/sec}$ |
| **Candidate Profile Retrieval** | $< 10\text{ ms}$ | $< 25\text{ ms}$ | $< 45\text{ ms}$ | $4,000\text{ req/sec}$ |
| **Application Submission & ATS** | $< 30\text{ ms}$ | $< 75\text{ ms}$ | $< 140\text{ ms}$ | $1,200\text{ req/sec}$ |
| **Real-Time WebSocket Message Dispatch**| $< 5\text{ ms}$ | $< 15\text{ ms}$ | $< 30\text{ ms}$ | $10,000\text{ concurrent conns}$ |
| **Health Probe Execution (`/health/live`)**| $< 1\text{ ms}$ | $< 2\text{ ms}$ | $< 5\text{ ms}$ | $10,000\text{ req/sec}$ |

---

## 3. Database Optimization & Anti-Pattern Elimination

1. **Zero N+1 Query Workflows**: Application candidate lists, discussion feeds, and conversation history utilize SQL joins or batch preloading.
2. **Bounded Pagination Limits**: All listing endpoints enforce `LIMIT <= 100` and parameterized offsets, preventing unbounded memory spikes.
3. **Async External Execution**: AI provider calls, SMTP email dispatches, and WebSocket notifications execute **outside** active database transaction blocks to prevent connection pool exhaustion.
4. **Automated LRU Cache Eviction**: Redis cache configured with `--maxmemory-policy allkeys-lru` and transparent fallbacks to PostgreSQL when offline.
