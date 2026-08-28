# Kirmya Analytics SRE & Operational Monitoring Manual

## 1. System Performance & Telemetry Diagnostics
- **Pipeline Latency Gauges**: Real-time tracking of event ingestion P95 latency, database query times, and OpenTelemetry trace spans.
- **Worker Health Monitoring**: Monitors async consumer queue depth and automatic dead-letter queue retries.
- **Alerting Thresholds**: Triggers immediate alerts if ingestion error rates exceed 1% or database connection pool utilization exceeds 85%.
