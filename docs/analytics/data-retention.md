# Kirmya Analytics Data Retention & Scheduled Aggregations

## 1. Raw Event Purge Schedule
- Raw individual event logs in `analytics_events` are purged after 90 days.
- Pre-computed daily and monthly rollup tables (`analytics_daily_rollups`) retain statistical totals indefinitely without storing user PII.

---

## 2. Automated Retention Worker
Background workers trigger monthly partition drop scripts and cleanup jobs to keep storage lean and prevent unbounded table growth.
