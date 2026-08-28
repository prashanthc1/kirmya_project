# Kirmya Production Infrastructure & Deployment Architecture

## 1. Multi-Tier Production Topology

```
┌─────────────────────────────────────────────────────────────┐
│                 Cloudflare Edge & CDN (WAF / SSL)           │
│        (DDoS Mitigation, Edge Caching, TLS 1.3 Termination) │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│ Vercel Next.js Edge   │             │ Railway Gin Backend   │
│ (SSR / Static Assets) │ ──────────> │ (Modular Monolith)    │
└───────────────────────┘             └───────────┬───────────┘
                                                  │
            ┌──────────────────┬──────────────────┼──────────────────┐
            ▼                  ▼                  ▼                  ▼
┌───────────────────────┐┌───────────┐┌───────────────────────┐┌───────────┐
│ PostgreSQL 16 (PGX)   ││Redis Cache││ NATS Core Message Bus ││OpenSearch │
│ (SSL Encrypted Pool)  ││ (TLS Mode)││ (JetStream Workflows) ││(Distributed│
└───────────────────────┘└───────────┘└───────────────────────┘└───────────┘
```
