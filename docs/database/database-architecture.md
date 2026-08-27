# Kirmya PostgreSQL Architecture & Connection Pool Sizing

## 1. Multi-Tier Storage Topology
- **Primary Read-Write PostgreSQL**: Manages ACID transactional state for users, jobs, applications, and communities.
- **Connection Pooling (`pgxpool`)**:
  - `MaxConns`: 50 connections per API instance.
  - `MinConns`: 10 idle connections.
  - `MaxConnLifetime`: 30 minutes.
  - `MaxConnIdleTime`: 5 minutes.
  - `HealthCheckPeriod`: 1 minute.
- **Transactional Atomicity**: Multi-step domain operations (e.g. application submission + notification dispatch) bound in explicit `pgx.Tx` scopes.
