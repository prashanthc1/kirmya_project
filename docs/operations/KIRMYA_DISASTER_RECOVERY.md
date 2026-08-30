# Kirmya Platform Disaster Recovery & Business Continuity Plan

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: PRODUCTION DISASTER RECOVERY ESTABLISHED  

---

## 1. System Recovery Objectives

* **Recovery Point Objective (RPO)**:
  * Database Data: $< 15\text{ minutes}$ (via continuous WAL archiving).
  * Storage Objects (resumes/photos): $< 1\text{ hour}$ (via cross-region replication).
* **Recovery Time Objective (RTO)**:
  * Application Tier: $< 10\text{ minutes}$ (containerized deployment restart).
  * Database Restore: $< 30\text{ minutes}$ for complete cold restore.

---

## 2. Component Recovery Priority & Sequencing

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Primary Database (PostgreSQL 16) ➔ Restore WAL / Daily Snapshot               │
│ PHASE 2: Application Cluster ➔ Boot Kirmya Monolith Containers & Verify Migrations     │
│ PHASE 3: Cache & PubSub ➔ Initialize Redis & In-Memory Fallback Engines                │
│ PHASE 4: Object Storage & Search ➔ Verify S3 MinIO buckets & Sync Search Indexes       │
│ PHASE 5: Web & WebSocket Gateway ➔ Open Ingress Routes & Verify /health/ready Check    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Degraded Service Modes

1. **AI Provider Outage**: Platform seamlessly falls back to deterministic rule-based job matching and keyword parsing. User experience remains unbroken.
2. **Redis Outage**: Application automatically switches to local thread-safe in-memory cache and directly queries PostgreSQL.
3. **SMTP Email Outage**: Verification tokens and password reset requests are queued or logged for retry without dropping registered accounts.
