# Kirmya Production Deployment & Rollback Strategy Manual

## 1. Zero-Downtime Deployment & Canary Pipelines
- **Railway Backend Deployment**: Health check probes (`/api/v1/system/health`) gate rolling container replacement.
- **Vercel Next.js Edge Deployment**: Instant atomic deployments with preview URLs and automated rollback triggers.
- **Database Migration Sequencing**: Backward-compatible expand/contract schema migrations execute before application image switches.
