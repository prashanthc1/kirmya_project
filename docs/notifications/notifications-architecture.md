# Kirmya Notification Architecture & Multi-Channel Pipeline

## 1. End-to-End Delivery Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Domain Service │ ──► │  NATS JetStream │ ──► │  Notification   │
│  (Jobs, Auth..) │     │   Event Bus     │     │     Worker      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌────────────────────────────────┴────────────────────────────────┐
                        ▼                                 ▼                               ▼
               ┌─────────────────┐               ┌─────────────────┐             ┌─────────────────┐
               │     In-App      │               │  Transactional  │             │   Mobile Push   │
               │   PostgreSQL    │               │  Email (SMTP)   │             │   (APNs/FCM)    │
               └────────┬────────┘               └─────────────────┘             └─────────────────┘
                        │
                        ▼
               ┌─────────────────┐
               │    WebSocket    │
               │   Real-Time UI  │
               └─────────────────┘
```
