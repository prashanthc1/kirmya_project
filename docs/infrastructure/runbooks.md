# Kirmya Infrastructure SRE Runbooks

## Incident Response Scenarios

### Scenario A: High Memory Usage on Redis
1. Inspect memory usage: `docker exec -it kirmya-redis-prod redis-cli -a $REDIS_PASSWORD info memory`
2. Trigger manual eviction or purge expired keys if needed.

### Scenario B: PostgreSQL Database Connection Saturation
1. Query active pool connections: `SELECT count(*), state FROM pg_stat_activity GROUP BY state;`
2. If connection pool is exhausted, scale up `pgxpool` limits or enable PgBouncer proxy.

### Scenario C: Backend Service Unhealthy
1. Inspect container health logs: `docker inspect --format='{{json .State.Health}}' kirmya-backend-prod`
2. Check container logs: `docker logs --tail 100 kirmya-backend-prod`
