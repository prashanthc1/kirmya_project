# Kirmya Production Docker Engineering

## Container Resource Allocations & Limits

| Service | Minimum CPU Reservation | CPU Limit | Minimum Memory Reservation | Memory Limit |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | `0.5 CPU` | `2.0 CPU` | `512MB` | `2.0GB` |
| **Redis Cache** | `0.2 CPU` | `1.0 CPU` | `128MB` | `512MB` |
| **Go Backend API** | `0.5 CPU` | `2.0 CPU` | `256MB` | `1.0GB` |
| **Next.js Frontend** | `0.25 CPU` | `1.5 CPU` | `256MB` | `1.0GB` |

## Graceful Shutdown Lifecycle
Upon receiving `SIGTERM` or `SIGINT`:
1. HTTP listeners stop accepting new inbound TCP connections.
2. Active background worker routines finish processing current NATS/queue jobs.
3. Database pool connection handles (`pgxpool`) drain safely.
4. Redis connections and OpenTelemetry tracer buffers flush cleanly.
