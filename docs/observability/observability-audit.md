# Kirmya Observability, Monitoring & SRE Audit

## Executive Summary
This document audits the Three Pillars of Observability (Structured Logs, Prometheus Metrics, OpenTelemetry Distributed Tracing), Service-Level Objectives (SLOs), Error Budgets, and SRE Alerting Policies across Kirmya.

---

## 1. Unified Telemetry Architecture

```
                                  Client Browser / Next.js
                                             │
                              TraceContext (W3C traceparent)
                                             │
                                             ▼
                                     Gin REST API Server
                         ├── zap.Logger (Structured JSON + PII Redaction)
                         ├── prometheus.Registry (HTTP RPS, Error, Latency)
                         └── otel.Tracer (Span Exporter to OTel Collector)
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
              PostgreSQL (pgxpool)     Redis (go-redis)       NATS Event Bus
             (Query Latency Spans)   (Cache Hit/Miss Spans)   (Message Pub/Sub)
```

---

## 2. Telemetry Standards
- **Zero PII Leakage**: Automated zap logging interceptors sanitize `Authorization` headers, passwords, session cookies, and message payloads.
- **Trace Context Propagation**: W3C `traceparent` and `tracestate` headers injected across HTTP calls, NATS messages, and asynchronous background worker contexts.
- **Cardinality Management**: Metric label dimensions strictly exclude user IDs, emails, and dynamic query strings to eliminate memory explosion.
