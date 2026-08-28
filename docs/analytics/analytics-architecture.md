# Kirmya Analytics Platform Architecture & Ingestion Pipelines

## 1. Analytics & Event Processing Pipelines

```
┌─────────────────────────────────────────────────────────────┐
│                 Domain Event Ingestion Pipeline             │
│        (User Signup, Job View, Application, Assessment)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Central Analytics Service                   │
│   (Schema Validation, Idempotency Deduplication & Consent)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│   NATS Event Stream   │             │   PostgreSQL Analytics│
│ (Async Worker Ingest) │             │ (Materialized Views)  │
└───────────────────────┘             └───────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           Role-Scoped Dashboards & BI Reporting             │
│     (Admin Console, Org Hiring Desk, Candidate Insights)    │
└─────────────────────────────────────────────────────────────┘
```
