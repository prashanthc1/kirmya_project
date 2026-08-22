# Kirmya Infrastructure Architecture

## Architecture Principles

1. **Strict Network Segmentation**: Frontend and Backend containers reside on an isolated application bridge network. Database (PostgreSQL), Cache (Redis), and Search (OpenSearch) nodes operate within an enclosed private data subnet with zero public internet exposure.
2. **Stateless Compute Scaling**: Go backend application nodes and Next.js frontend rendering instances are fully stateless, relying on Redis for session token invalidation and PostgreSQL for transactional durability.
3. **Multi-Stage Container Security**: Build compilers (Go SDK, Node build tools) are discarded during image compilation, producing lightweight runtime images running as unprivileged non-root users (`kirmya` and `nextjs`).
4. **Graceful Degraded Operations**: If auxiliary dependencies (Redis, OpenSearch, OTEL) experience intermittent outages, backend services degrade gracefully to primary PostgreSQL queries without crashing.
