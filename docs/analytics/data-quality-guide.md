# Kirmya Analytics Data Quality & Pipeline Monitoring Manual

## 1. Data Quality Assurance & Drift Detection
- **Schema Validation Rules**: Rejects oversized payloads (>64KB), missing entity references, or unregistered event types.
- **Idempotency Deduplication**: Drops duplicate event dispatches within a 5-minute sliding deduplication window.
- **Reconciliation Engine**: Compares transactional PostgreSQL totals against pre-aggregated analytical caches to detect drift.
