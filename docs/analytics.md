# Kirmya Central Analytics, Business Intelligence & Scheduled Reporting Subsystem

## 1. Architectural Overview
Kirmya provides a production-ready, privacy-first analytics and business intelligence infrastructure. It standardizes telemetry ingestion across platform growth, job market demand, application funnels, zero-result search discovery, recommendation conversions, and personal seeker career dashboards.

```
Event Producers (Web/Mobile) → Privacy & PII Filter → Pre-Aggregation Worker
                                                            ↓
                                               PostgreSQL / Daily Metrics
                                                            ↓
                                               Executive BI Studio & Scheduled Reports
```

## 2. Key Capabilities
- **Privacy Threshold (N=5)**: Aggregated reports with sample sizes smaller than 5 users/events are suppressed to prevent individual re-identification.
- **Zero Content Inspection**: Messaging analytics collect metadata (count, delivery success, latency) only. Message body contents are never inspected or stored.
- **CSV Formula Injection Defense**: All exported spreadsheet cells starting with `=`, `+`, `-`, or `@` are sanitized with leading single quotes (`'`) to prevent formula execution in MS Excel or Google Sheets.
- **Data Retention & Aggregation**: Raw events are retained for 30 days and automatically cleaned by worker scripts, while pre-computed daily aggregates are retained permanently for trend analysis.
- **Scheduled Cron Reports**: Admins can configure recurring cron digests (e.g. `0 0 * * 1` for weekly Monday 00:00 UTC) delivered to authorized recipient emails.

## 3. RBAC Matrix
- `analytics.read`: View executive dashboards and user career metrics.
- `analytics.export`: Request asynchronous CSV/XLSX/PDF exports.
- `analytics.manage`: Create and manage recurring scheduled reports.
