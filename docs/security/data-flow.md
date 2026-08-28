# Kirmya Platform End-to-End Data Flow Architecture

## 1. System Data Movement & Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Browser (TLS 1.3 / HSTS)             │
│        (MUI v6 Next.js, Secure Cookies, CSP Nonces)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Kirmya Gin API Gateway                      │
│     (Strict CORS, Token-Bucket Rate Limiter, JWT/MFA Auth)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
┌───────────────────────┐┌───────────┐┌───────────────────────┐
│ PostgreSQL 16 Cluster ││Redis Cache││   NATS Event Bus      │
│ (AES-256 / SSL Enforce││(Encrypted)││ (TLS Client Auth)     │
└───────────────────────┘└───────────┘└───────────────────────┘
            │                                     │
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│ Encrypted Object Store│             │ OpenSearch Cluster    │
│ (Signed URLs / S3 KMS)│             │ (mTLS / PII-Stripped) │
└───────────────────────┘             └───────────────────────┘
```
