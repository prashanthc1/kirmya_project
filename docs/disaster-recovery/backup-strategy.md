# Kirmya Production Backup Strategy & Data Classification

## Executive Summary
This document defines the production backup strategy, data classification tiers, encryption standards, retention policies, and offsite storage requirements for Kirmya's PostgreSQL database, S3 object storage, OpenSearch cluster, Redis cache, and NATS event streams.

---

## 1. Data Classification Tiers

| Data Category | Target Component | Backup Strategy | RPO Target | RTO Target |
| :--- | :--- | :--- | :--- | :--- |
| **Critical** | PostgreSQL (Users, Orgs, Jobs, Apps, Security Logs) | Continuous WAL archiving + Daily Full Snapshots | <= 15 minutes | <= 1 hour |
| **Important** | S3 / MinIO (Resumes, Avatars, Org Assets) | Cross-Region Replication + Daily Incremental Snapshots | <= 1 hour | <= 2 hours |
| **Rebuildable**| OpenSearch (Search Indices) | Daily Snapshot Repositories (Rebuild from PG source) | <= 24 hours | <= 4 hours |
| **Ephemeral**  | Redis (Sessions, Caches, Rate Limit Counters) | Rebuilt on startup / DB fallback (No backup required) | N/A | <= 5 minutes |

---

## 2. PostgreSQL Backup Specification
- **Full Backup**: Executed daily via `pg_dumpall` / `pg_basebackup` with AES-256 GCM encryption.
- **Point-in-Time Recovery (PITR)**: Continuous WAL archiving shipped to secondary offsite object storage.
- **Backup Verification**: Automated nightly restore drill into an isolated staging container, running `go test ./test/integration/...` schema checks before marking status `VERIFIED`.
- **Retention**: 7 daily snapshots, 4 weekly snapshots, 12 monthly snapshots.
