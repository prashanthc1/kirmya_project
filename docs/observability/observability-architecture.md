# Kirmya Observability Architecture & SRE Operating System

## Executive Summary
This document defines the end-to-end Telemetry Architecture, OpenTelemetry Context Propagation, High-Cardinality Controls, Log Privacy Filters, and Grafana Dashboard Standards across Kirmya.

---

## 1. Unified Telemetry Flow

```
+-------------------------------------------------------------------------+
|                          Next.js Web Frontend                           |
|      (Client-side Web Vitals, Error Tracking, OpenTelemetry Tracer)     |
+-------------------------------------------------------------------------+
                                     |
                       W3C Traceparent Header
                                     v
+-------------------------------------------------------------------------+
|                           Gin REST API Server                           |
|   - Structured JSON Logs (Zap + Automated PII Redaction Filter)         |
|   - Prometheus Metrics (/metrics: RPS, Error Rates, P50/P95/P99)        |
|   - OpenTelemetry Distributed Traces (Span Exporters to Collector)      |
+-------------------------------------------------------------------------+
            |                        |                        |
            v                        v                        v
+-----------------------+ +--------------------+ +------------------------+
| PostgreSQL (pgxpool)  | |  Redis Cache Engine| | NATS JetStream Pub/Sub |
| Query Latency Spans   | | Hit/Miss Telemetry | | Consumer Lag & Worker  |
+-----------------------+ +--------------------+ +------------------------+
```
