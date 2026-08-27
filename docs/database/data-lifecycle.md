# Kirmya Data Lifecycle, Archival & Automated Purge Policies

## 1. Automated Purge & Retention Matrix
- **Raw Telemetry & Audit Logs**: Retained in hot table for 90 days; rolled up into monthly aggregates; raw rows purged via batched cleanup worker.
- **Read Notifications**: Notifications marked as read purged after 180 days.
- **Account Deletion (DSAR)**: 30-day soft deactivation with immediate search delisting, followed by hard erasure and community content pseudonymization.
