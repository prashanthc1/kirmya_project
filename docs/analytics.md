# Kirmya Platform Analytics, Business Intelligence & Reporting System

## 1. Overview & Architecture

The Kirmya Platform Analytics, Business Intelligence & Reporting System provides unified event tracking, real-time metrics aggregation, cohort analysis, trust & safety monitoring, user activation funnels, feature adoption metrics, user consent management, and customizable export services across candidate, recruiter, company, and admin workflows.

### High-Level Architecture Diagram
```
                      ┌──────────────────────┐
                      │    Client Events     │
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │  REST API Gateway    │
                      │  (/api/v1/analytics) │
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │  Consent & Schema    │
                      │     Validation       │
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │  NATS JetStream Bus  │
                      │ (analytics.events.*) │
                      └──────────┬───────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
         ┌───────────────────┐      ┌──────────────────┐
         │ Background Worker │      │ PostgreSQL Store │
         │   (Aggregator)    │      │(analytics_events)│
         └──────────┬────────┘      └──────────────────┘
                    │
                    ▼
         ┌───────────────────┐
         │ Daily Aggregates  │
         │  & Cohort Grids   │
         └───────────────────┘
```

---

## 2. Event Schemas & Versioning Rules

All events ingested into the platform follow semantic versioning (`v1.0.0`, `v1.1.0`, `v2.0.0`).

### Schema Structure
```json
{
  "event_type": "profile.viewed",
  "event_version": "1.0.0",
  "user_id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
  "organization_id": "e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
  "entity_type": "user_profile",
  "entity_id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
  "session_id": "sess-99201-ab4",
  "source": "web",
  "platform": "desktop",
  "idempotency_key": "evt_idem_8820391029",
  "metadata": {
    "section_viewed": "experience",
    "device_type": "macOS"
  }
}
```

### Versioning & Compatibility Rules
1. **Patch Updates (`1.0.x`)**: Bug fixes in event definitions. Fully backward compatible.
2. **Minor Updates (`1.x.0`)**: Addition of non-breaking metadata fields. Fully backward compatible.
3. **Major Updates (`x.0.0`)**: Breaking schema changes, removal or renaming of required fields. Requires new stream routing key and dual-ingestion period.

---

## 3. NATS Streaming & Event Routing

Events are published asynchronously to NATS JetStream topics using structured subject hierarchy:
- `analytics.events.user.*` (e.g., `analytics.events.user.registered`, `analytics.events.user.profile_completed`)
- `analytics.events.job.*` (e.g., `analytics.events.job.viewed`, `analytics.events.job.applied`)
- `analytics.events.mentorship.*` (e.g., `analytics.events.mentorship.requested`, `analytics.events.mentorship.completed`)
- `analytics.events.learning.*` (e.g., `analytics.events.learning.resource_viewed`, `analytics.events.learning.completed`)
- `analytics.events.system.*` (e.g., `analytics.events.system.latency_sample`, `analytics.events.system.error_rate`)

---

## 4. PostgreSQL Schema & Indexes

### Tables
1. `analytics_events_v2`
   - `id` (UUID, Primary Key)
   - `event_type` (VARCHAR(128), Not Null)
   - `event_version` (VARCHAR(32), Default '1.0.0')
   - `user_id` (UUID, Nullable)
   - `organization_id` (UUID, Nullable)
   - `entity_type` (VARCHAR(64))
   - `entity_id` (VARCHAR(128))
   - `session_id` (VARCHAR(128))
   - `source` (VARCHAR(64))
   - `platform` (VARCHAR(64))
   - `metadata` (JSONB)
   - `idempotency_key` (VARCHAR(128), Unique Index)
   - `created_at` (TIMESTAMPTZ, Default NOW())

2. `analytics_user_consents`
   - `user_id` (UUID, Primary Key)
   - `essential_telemetry_enabled` (BOOLEAN, Default True)
   - `optional_analytics_enabled` (BOOLEAN, Default True)
   - `personalization_enabled` (BOOLEAN, Default True)
   - `updated_at` (TIMESTAMPTZ, Default NOW())

3. `analytics_daily_aggregates`
   - `id` (UUID, Primary Key)
   - `metric_type` (VARCHAR(64), Not Null)
   - `dimension_key` (VARCHAR(128))
   - `period_date` (DATE, Not Null)
   - `metric_value` (NUMERIC, Not Null)
   - `updated_at` (TIMESTAMPTZ, Default NOW())

### Indexes
- `idx_analytics_events_type_created` ON `analytics_events_v2 (event_type, created_at DESC)`
- `idx_analytics_events_user_created` ON `analytics_events_v2 (user_id, created_at DESC)`
- `idx_analytics_events_org_created` ON `analytics_events_v2 (organization_id, created_at DESC)`
- `idx_analytics_events_idempotency` ON `analytics_events_v2 (idempotency_key)` WHERE `idempotency_key IS NOT NULL`
- `idx_analytics_daily_agg_metric_date` ON `analytics_daily_aggregates (metric_type, period_date)`

---

## 5. Privacy Safeguards & Minimum Cohort Thresholds

To prevent individual re-identification and preserve user confidentiality:
- **Minimum Privacy Threshold (`MinPrivacyThreshold = 5`)**: Any aggregated cohort grid, funnel stage, or group metric where active participant count is greater than zero but less than 5 is automatically padded, bucketed, or masked to `5`.
- **Zero Content Inspection**: Messaging analytics collect metadata ONLY (delivery rates, count, response times) with zero payload content inspection.

---

## 6. User Consent Integration

User privacy choices are respected across all analytics processing pipelines:
1. `EssentialTelemetryEnabled` (default `true`): System security, health, and audit logging. Always processed.
2. `OptionalAnalyticsEnabled` (default `true`): Behavioral analytics, funnel tracking, and product improvement telemetry. Rejected with `ErrConsentDenied` when disabled.
3. `PersonalizationEnabled` (default `true`): Recommendation tuning and individualized career suggestions.

---

## 7. Data Retention & Purging Rules

To balance operational history with compliance (GDPR / CCPA):
- **Raw Events (`analytics_events_v2`)**: Retained for `RetentionDays` (default 90 days). Purged automatically by background cleanup worker (`CleanupExpiredAnalyticsEvents`).
- **Daily Aggregates (`analytics_daily_aggregates`)**: Preserved indefinitely (`KeepDailyAggregates = true`) for trend analysis and historical reporting.

---

## 8. Custom Reports & Export Security

### Export Formats
- CSV, JSON.

### Security Measures
1. **CSV Injection Defense**: All cell values starting with `=`, `+`, `-`, or `@` are escaped using single quotes via `SanitizeCSVCell(value)`.
2. **Download Link Expiration**: Export links are signed with a 7-day TTL expiration (`expires_at`).
3. **RBAC & Authorization**: Admin export endpoints require administrative privileges (`/api/v1/admin/analytics/export`).
