# Kirmya Infrastructure Scaling & Capacity Planning

## Horizontal & Vertical Scaling Controls

1. **Backend Stateless Replica Scaling**: Backend API containers scale horizontally up to 10 instances behind the load balancer.
2. **Database Connection Pool Sizing**:
   - Connection formula: `MaxReplicas * MaxPoolSize + WorkerPool <= PostgresMaxConnections`
   - Default pool limit per backend instance: `25 connections`.
   - PostgreSQL `max_connections` configured to `200` to prevent connection exhaustion.
3. **Redis Memory Management**: Enforces LRU memory eviction policy (`--maxmemory 256mb --maxmemory-policy allkeys-lru`) to guarantee memory stability under high request bursts.
