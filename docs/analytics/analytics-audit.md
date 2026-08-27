# Kirmya Platform Analytics, BI & Telemetry System Audit

## Executive Summary
This document audits the platform analytics architecture, event ingestion pipeline, roll-up aggregations, KPI computation engine, recruiter job metrics, and privacy safeguards (minimum group size threshold = 5) in Kirmya.

---

## 1. Multi-Tier Analytics Architecture

```
                    Domain Service Events (NATS / PubSub)
                                      │
                                      ▼
                        Analytics Ingestion Pipeline
                        ├── Event Schema & Metadata Validation
                        ├── User Telemetry Consent Filtering
                        └── Idempotent Deduplication (Redis 24h)
                                      │
                                      ▼
                     PostgreSQL Analytics Event Store
                      ├── Partitioned Event Tables (`analytics_events`)
                      ├── Materialized Views / Rollups (`daily_aggregates`)
                      └── Cohort Grids & Activation Funnels
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
  Admin Control Center        Recruiter Analytics         Personal Career View
 (`/admin/analytics`)      (`/recruiter/analytics`)         (`/analytics`)
```

---

## 2. Privacy & Aggregation Safeguards
- **Minimum Cohort Threshold (k >= 5)**: To prevent reverse-identification of individual user behaviors, aggregate metrics are suppressed or rounded when cohort group sizes fall below 5.
- **Strict Data Minimization**: Message bodies, password hashes, and recruiter internal evaluation notes are stripped prior to event ingestion.
