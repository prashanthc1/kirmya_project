# Kirmya Production Infrastructure & Networking Hub

Welcome to the Infrastructure Engineering, Docker Hardening, Network Segmentation, and Cloudflare Architecture documentation for Kirmya.

## Documentation Index

- [`infrastructure-audit.md`](infrastructure-audit.md): Complete audit of container configurations, network boundaries, and port exposures.
- [`architecture.md`](architecture.md): Top-level production topology (Internet → Cloudflare → Nginx → Frontend → Backend → DB/Cache/Bus).
- [`networking.md`](networking.md): Network isolation tiers, private Docker bridges, and internal DNS service resolution.
- [`docker.md`](docker.md): Multi-stage Dockerfiles, image optimization, non-root execution, and health checks.
- [`security.md`](security.md): Container hardening standards, Linux capability drops, read-only root filesystems, and secret protection.
- [`scaling.md`](scaling.md): Horizontal pod autoscaling, resource limits (CPU/Memory), and database connection scaling.
- [`cloudflare.md`](cloudflare.md): Cloudflare WAF rules, SSL/TLS full mode, CDN static asset caching, and origin IP protection.
- [`disaster-recovery.md`](disaster-recovery.md): Infrastructure failover procedures, persistent volume snapshotting, and DNS cutover.
- [`runbooks.md`](runbooks.md): Step-by-step infrastructure troubleshooting runbooks for container restart loops, disk space, and network degradation.

## Core Infrastructure Commands

### Production Stack Orchestration
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Health & Readiness Check
```bash
curl -f http://localhost:8080/api/v1/system/health
```
