# Kirmya Infrastructure & SRE Documentation

Welcome to the Infrastructure Engineering, Container Hardening, and Production Topology documentation for Kirmya.

## Documentation Index

- [`infrastructure-audit.md`](infrastructure-audit.md): Production topology, network boundaries, and port audit.
- [`architecture.md`](architecture.md): Infrastructure design principles and network segmentation.
- [`networking.md`](networking.md): Forwarded headers, TLS 1.3, and HSTS security policy.
- [`docker.md`](docker.md): Container resource limits, CPU/memory allocations, and graceful shutdown.
- [`scaling.md`](scaling.md): Stateless scaling, database pool sizing, and memory management.
- [`cloudflare.md`](cloudflare.md): Edge WAF rules, CDN caching policy, and origin protection.
- [`runbooks.md`](runbooks.md): Step-by-step SRE infrastructure incident runbooks.

## Infrastructure Orchestration

```bash
# Start Production Orchestration Stack
docker-compose -f docker-compose.production.yml up -d
```
