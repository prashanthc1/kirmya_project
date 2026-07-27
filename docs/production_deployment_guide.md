# Kirmya Production Infrastructure & Deployment Guide

This guide details the production deployment architecture for **Kirmya**, covering backend container deployment on **Railway**, frontend deployment on **Vercel**, database provision, SSL/HTTPS, CORS security, and environment configuration.

---

## 🏛️ Production Deployment Topology

```
                  ┌──────────────────────────────────────────────┐
                  │                 Vercel Edge                  │
                  │       (Frontend: https://kirmya.vercel.app)  │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTPS / REST / WS
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             Railway Cloud Cluster            │
                  │   (Backend: https://api.kirmya.com)          │
                  └──────────────┬────────────────┬──────────────┘
                                 │                │
                     Internal TCP│                │Internal TCP
                                 ▼                ▼
                     ┌──────────────────┐  ┌──────────────┐
                     │ PostgreSQL (v16) │  │ Redis (v7)   │
                     └──────────────────┘  └──────────────┘
```

---

## 🚀 1. Backend Deployment (Railway)

### A. Railway Project & Infrastructure Provisioning
- **Project Name**: `Kirmya` (ID: `ee062bf0-6c8e-46c4-a9dd-de8e74ab4a4b`)
- **Services Created**:
  1. `kirmya-backend`: Go Multi-stage Docker Container.
  2. `postgres`: Managed PostgreSQL 16 Instance.
  3. `redis`: Managed Redis 7 In-Memory Cache.

### B. Railway Environment Variables (`kirmya-backend`)
| Variable | Production Value / Pattern | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgres://user:pass@postgres.railway.internal:5432/kirmya_prod` | Internal PostgreSQL connection pool string |
| `REDIS_URL` | `redis://default:pass@redis.railway.internal:6379` | Internal Redis cluster endpoint |
| `JWT_SECRET` | `prod_kirmya_jwt_secret_key_84920491823019283` | Cryptographic JWT signing secret (256-bit) |
| `REFRESH_TOKEN_SECRET` | `prod_kirmya_refresh_token_secret_key_9182391023910` | Session refresh token HMAC key |
| `ALLOWED_ORIGINS` | `https://kirmya.vercel.app,https://kirmya.com` | Strict CORS origin whitelist |
| `SMTP_CONFIG` | `{"host":"smtp.sendgrid.net","port":587...}` | Email delivery credentials |
| `STORAGE_CONFIG` | `{"provider":"s3","bucket":"kirmya-prod-assets"...}` | S3 object storage configuration |
| `PORT` | `8080` | Internal REST / WebSocket container port |

---

## 🌐 2. Frontend Deployment (Vercel)

### A. Vercel Project Setup
- **Framework**: Next.js 14 (Standalone Output)
- **Root Directory**: `frontend/`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### B. Vercel Environment Variables
| Variable | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://api.kirmya.com` | Backend REST & WebSocket public gateway |
| `NEXT_PUBLIC_APP_URL` | `https://kirmya.vercel.app` | Frontend canonical URL |

---

## 🔒 3. Security, HTTPS, CORS & Headers

1. **HTTPS Enforcement**: TLS 1.3 enabled automatically via Vercel Edge & Railway Cloud SSL certs.
2. **CORS Security**: Backend `ALLOWED_ORIGINS` dynamically checks incoming `Origin` headers and sets `Access-Control-Allow-Credentials: true`.
3. **HTTP Security Headers** (Injected via `frontend/next.config.mjs` & `frontend/vercel.json`):
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 🛠️ 4. Triggering Deployments

- **Automatic Continuous Deployment**: Pushing to `main` branch automatically triggers GitHub Actions pipelines (`.github/workflows/frontend.yml` and `.github/workflows/backend.yml`), deploying the backend to Railway and frontend to Vercel upon 100% test pass verification.
