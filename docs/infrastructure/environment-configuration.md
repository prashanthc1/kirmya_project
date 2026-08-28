# Kirmya Environment Configuration & Variable Catalog

## 1. Environment Variable Specifications
| Variable Name | Required | Default / Format | Classification | Description |
| :--- | :---: | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | `postgres://user:pass@host:5432/kirmya?sslmode=verify-full` | Secret | Authoritative PostgreSQL connection string |
| `REDIS_URL` | No | `rediss://default:pass@host:6379` | Secret | Encrypted Redis connection URI |
| `NATS_URL` | No | `nats://host:4222` | Internal | Asynchronous event broker URL |
| `OPENSEARCH_URL` | No | `https://admin:pass@host:9200` | Secret | OpenSearch search cluster endpoint |
| `JWT_SECRET` | Yes | `64-character hex string` | High Secret | HMAC-SHA256 signing secret for authentication |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | `http://localhost:4317` | Internal | OpenTelemetry collector gRPC endpoint |
