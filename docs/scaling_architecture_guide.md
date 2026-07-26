# Kirmya High-Load Scaling Architecture & Infrastructure Guide (10M+ Users)

This document provides technical scaling specifications for operating Kirmya at **10,000,000+ active users** across web, native Android (Kotlin), and iOS (Swift) clients.

---

## 🚀 1. Architectural Scaling Pillars

```
                      ┌─────────────────────────────────┐
                      │    Cloudflare Edge CDN / WAF    │
                      └────────────────┬────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │ Kubernetes HPA (10 -> 100 Pods) │
                      └────────────────┬────────────────┘
                                       │
       ┌───────────────────────────────┼───────────────────────────────┐
       ▼                               ▼                               ▼
┌──────────────┐             ┌───────────────────┐           ┌───────────────────┐
│ Event Bus    │             │ Redis Cluster L2  │           │ Worker Queue Pool │
│ (Async Msg)  │             │ (Multi-Tier Cache)│           │ (Bg Tasks)        │
└──────────────┘             └───────────────────┘           └───────────────────┘
       │                                                               │
       └───────────────────────────────┬───────────────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │ PostgreSQL Read Replica Router  │
                      │ (1 Primary + N Read Replicas)   │
                      └─────────────────────────────────┘
```

---

## 🐘 2. Database Scaling & Read Replica Routing

### Read/Write Separation
- **Primary Node**: Reserved strictly for `INSERT`, `UPDATE`, `DELETE` transactions.
- **Read Replica Nodes**: Load-balanced round-robin routing (`DBCluster.Replica()`) for read-heavy API queries (`GET /jobs`, `GET /search`, `GET /intelligence`).

### High-Volume Partitioning Strategy
- Composite indexes on `(created_at DESC)` and `(user_id)` applied across `analytics_events`, `search_history`, `recommendation_events`, and `audit_logs`.

---

## ⚡ 3. Multi-Tier Redis Caching Strategy

- **L1 In-Memory Cache**: Sub-millisecond latency for hot entity IDs.
- **L2 Redis Cluster Cache**: 5-minute to 24-hour TTL for complex queries (`GetOrFetch()`).
- **Stampede Protection**: Asynchronous single-flight locking preventing database connection spikes during cache misses.

---

## 🔄 4. Event Bus & Async Worker Queue

- **Event Bus (`events.EventBus`)**: Pub/Sub decoupling for domain events (`user.registered`, `job.applied`, `ai.match_computed`).
- **Worker Pool Queue (`queue.WorkerPool`)**: Concurrency-controlled task queue handling email delivery, push notification dispatches, and pre-aggregated metric rollups with exponential backoff retries.

---

## 🐳 5. Kubernetes & Edge CDN Deployments

- **HPA Auto-scaling**: Pods auto-scale from 10 to 100 replicas at 70% CPU / 80% Memory threshold.
- **Cloudflare CDN**: Assets cached globally across 300+ Edge locations with Brotli compression.
