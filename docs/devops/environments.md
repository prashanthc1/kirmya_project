# Kirmya Multi-Tier Environment Strategy

## 1. Environment Matrix

| Parameter | Local Development | Staging | Production |
| :--- | :--- | :--- | :--- |
| **API Domain** | `http://localhost:8080` | `https://api.staging.kirmya.com` | `https://api.kirmya.com` |
| **Frontend Domain** | `http://localhost:3000` | `https://staging.kirmya.com` | `https://kirmya.com` |
| **Database** | Local Docker PostgreSQL | Railway Staging DB | Railway Production Isolated DB |
| **Log Level** | `debug` | `info` | `warn` / `error` |
| **Telemetry** | Mock / Console | OpenTelemetry Collector | OpenTelemetry Production |
