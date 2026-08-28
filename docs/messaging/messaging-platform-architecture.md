# Kirmya Messaging Platform Architecture & Real-Time Lifecycle

## 1. Direct Messaging Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Sender Client   │ ──► │  Gin REST API   │ ──► │   PostgreSQL    │
│  (Next.js App)  │     │  (Verification) │     │ (Authoritative) │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                 │                       │
                                 ▼                       ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │ Redis Pub/Sub   │ ──► │  WebSocket Hub  │ ──► Recipient Client
                        │  (Distribution) │     │  (Session Gate) │
                        └─────────────────┘     └─────────────────┘
```
