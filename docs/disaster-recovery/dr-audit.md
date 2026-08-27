# Kirmya Disaster Recovery (DR) & Operational Resilience Audit

## Executive Summary
This document audits the Disaster Recovery (DR) posture, Recovery Time Objectives (RTO), Recovery Point Objectives (RPO), automated point-in-time recovery (PITR) mechanisms, regional failover protocols, and business continuity plans across Kirmya.

---

## 1. Recovery Objectives by Service Domain

| Business Service | Criticality Tier | RTO (Max Downtime) | RPO (Max Data Loss) | Failover Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Sessions** | Critical (Tier 1) | < 15 minutes | < 5 minutes | PostgreSQL PITR + Redis token rebuild |
| **Job Search & Listing** | High (Tier 2) | < 30 minutes | < 15 minutes | PostgreSQL GIN index fallback |
| **Job Applications & ATS** | Critical (Tier 1) | < 15 minutes | < 5 minutes | PostgreSQL WAL point-in-time restore |
| **Direct Messaging** | Medium (Tier 3) | < 60 minutes | < 15 minutes | Asynchronous NATS stream replay |
| **Analytics & Telemetry** | Low (Tier 4) | < 4 hours | < 24 hours | Daily aggregation rollups |
