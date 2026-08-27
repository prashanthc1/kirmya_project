# Kirmya Business Continuity & Graceful Degradation Specs

## Degraded Mode Operation Policies

1. **Search Degraded Mode**: If OpenSearch is unavailable, search API requests automatically degrade to parameterized PostgreSQL queries.
2. **Cache Degraded Mode**: If Redis fails, session lookup uses PostgreSQL fallback.
3. **Telemetry Degraded Mode**: OpenTelemetry exporter failures buffer spans locally without interrupting client HTTP responses.
4. **Email Notification Queuing**: Email alerts failed due to SMTP transport down are retained in dead-letter queues (`notification_dead_letters`) for retries.
