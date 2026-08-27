# Kirmya Secrets Management & Environment Security

## 1. Zero-Leakage Secrets Policy
- Production secrets (`DATABASE_URL`, `JWT_SECRET`, `REDIS_PASSWORD`, `NATS_AUTH_TOKEN`) are stored strictly in managed cloud environment stores.
- `.env.example` templates contain non-sensitive placeholder definitions only.
- Local developer credentials never connect to production environments.
