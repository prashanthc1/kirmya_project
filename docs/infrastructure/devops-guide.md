# Kirmya DevOps, Containerization & Tooling Manual

## 1. Local Development & Docker Orchestration
- **Docker Compose Stack**: `docker compose up -d` boots PostgreSQL 16, Redis 7, NATS JetStream, and OpenSearch clusters locally.
- **Reproducible Multi-Stage Dockerfiles**: Go backend builds into distroless non-root micro-images; Next.js builds into standalone production nodes.
- **Zero Raw Secret Storage**: Environment template files (`.env.example`) provide placeholder types without exposing real credentials.
