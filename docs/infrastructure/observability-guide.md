# Kirmya OpenTelemetry & Full-Stack Observability Guide

## 1. Unified Telemetry & Instrumentation Architecture
- **Distributed Context Propagation**: OpenTelemetry W3C TraceContext headers propagated across Next.js, Gin, PostgreSQL, and NATS workers.
- **Privacy-Filtered Spans**: PII, passwords, authentication secrets, and full resume texts are scrubbed from telemetry attributes before export.
- **OTLP Exporter Pipeline**: Standardized export to OpenTelemetry collectors via `OTEL_EXPORTER_OTLP_ENDPOINT`.
