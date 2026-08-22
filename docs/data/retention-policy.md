# Kirmya Data Retention & Lifecycle Policy

## Retention Schedule by Domain

| Domain / Data Type | Retention Period | Action Upon Expiration | Legal Hold Override? |
| :--- | :--- | :--- | :--- |
| **Notifications & Alerts** | 90 Days | Hard Purge via Retention Engine | Yes (Shielded) |
| **User Activity Logs** | 180 Days | Aggregated to daily metrics & purged | Yes (Shielded) |
| **Audit Logs** | 365 Days | Compressed & archived to cold vault | Yes (Shielded) |
| **Deleted User Profiles** | 30 Days (Grace) | Permanently anonymized / purged | Yes (Blocks Deletion) |
| **Job Applications** | 730 Days (2 Years) | Anonymized for talent analytics | Yes (Shielded) |

## Retention Engine Safeguards
- Runs incrementally in background batches to prevent database locks.
- Idempotent and dry-run capable (`ExecuteDryRun: true`).
- Bypasses records associated with an active `LegalHold` entry in PostgreSQL.
