# Kirmya Environment Management & Configuration Isolation

## 1. Environment Topology & Secrets Isolation

| Environment | Purpose | Hosting Platform | Database Isolation | Secrets Store |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | Developer testing | Docker Compose | Local PostgreSQL container | `.env.local` (uncommitted) |
| **Staging** | Pre-production validation | Railway / Vercel Preview | Isolated Staging PostgreSQL | Railway / Vercel Staging Env |
| **Production** | Live end-user traffic | Railway / Vercel Prod | Dedicated HA PostgreSQL | Railway / Vercel Encrypted Secrets |
