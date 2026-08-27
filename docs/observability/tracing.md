# Kirmya Distributed Tracing & OpenTelemetry Context Propagation

## 1. W3C TraceContext Propagation
- Inbound HTTP headers (`traceparent`) are extracted by Gin middleware to establish parent span contexts.
- Downstream PostgreSQL calls, Redis queries, and NATS event publications attach child spans with duration and status code metadata.
- Production trace sampling rate is tuned to 10% for successful requests and 100% for error requests (`status >= 500`).
