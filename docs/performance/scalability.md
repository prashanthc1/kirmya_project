# Kirmya Horizontal Scalability & Resource Allocation

## 1. Stateless API Scaling Architecture
- **Stateless HTTP Handlers**: All session and authentication state is externalized to Redis / PostgreSQL, allowing arbitrary horizontal scaling of API backend instances behind Cloudflare / Railway load balancers.
- **Connection Draining**: In-flight requests are granted up to 30 seconds to complete gracefully upon receiving `SIGTERM`.
