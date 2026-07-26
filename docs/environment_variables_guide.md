# Kirmya Master Environment Variables & Configuration Guide

This document provides complete technical specifications for configuring environment variables across **Local Development**, **Docker & Docker Compose**, **Railway**, and **Vercel**.

---

## 📋 Environment Variable Reference

### 1. Application Metadata & Globals
| Variable | Type | Default | Required? | Description |
| :--- | :---: | :---: | :---: | :--- |
| `APP_NAME` | String | `Kirmya AI Career Companion` | Optional | Human-readable application title |
| `APP_ENV` | String | `development` | Required | Environment mode (`development`, `staging`, `production`) |
| `APP_VERSION` | String | `2.1.0` | Optional | Semantic version identifier |
| `APP_BASE_URL` | String | `http://localhost:3000` | Optional | Canonical web app URL |
| `FRONTEND_URL` | String | `http://localhost:3000` | Required | Frontend web application origin for CORS |
| `BACKEND_URL` | String | `http://localhost:8080` | Required | API server base URL |
| `API_URL` | String | `http://localhost:8080/api/v1` | Required | API v1 endpoint URI |
| `SITE_TITLE` | String | `Kirmya | AI Career Assistance` | Optional | SEO title tag |
| `TIMEZONE` | String | `UTC` | Optional | Application default timezone |
| `DEFAULT_LOCALE` | String | `en` | Optional | Default language code |

### 2. Frontend Configuration (Next.js)
| Variable | Type | Default | Required? | Description |
| :--- | :---: | :---: | :---: | :--- |
| `NEXT_PUBLIC_API_URL` | String | `http://localhost:8080/api/v1` | Required | Client-accessible API endpoint |
| `NEXT_PUBLIC_APP_URL` | String | `http://localhost:3000` | Required | Client-accessible web URL |
| `NEXT_PUBLIC_CDN_URL` | String | `http://localhost:3000/assets` | Optional | Public CDN origin for static assets |
| `NEXT_PUBLIC_ENV` | String | `development` | Required | Next.js runtime environment |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Bool | `true` | Optional | Analytics tracker toggle |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | Bool | `false` | Optional | Maintenance mode UI banner toggle |
| `NEXT_PUBLIC_COOKIE_CONSENT_VERSION` | String | `v1.0` | Optional | Privacy cookie banner version key |

### 3. Backend Server (Golang Gin)
| Variable | Type | Default | Required? | Description |
| :--- | :---: | :---: | :---: | :--- |
| `SERVER_HOST` | String | `0.0.0.0` | Optional | Bind host IP address |
| `SERVER_PORT` | String | `8080` | Optional | HTTP listen port |
| `API_PREFIX` | String | `/api/v1` | Optional | API route group prefix |
| `READ_TIMEOUT` | Duration | `15s` | Optional | HTTP server read timeout |
| `WRITE_TIMEOUT` | Duration | `15s` | Optional | HTTP server write timeout |
| `IDLE_TIMEOUT` | Duration | `60s` | Optional | HTTP server keep-alive idle timeout |
| `CORS_ORIGINS` | String | `http://localhost:3000` | Required | Comma-separated allowed CORS origins |
| `MAX_REQUEST_BODY_SIZE` | Int | `10485760` (10MB) | Optional | Max payload size in bytes |
| `UPLOAD_DIR` | String | `./uploads` | Optional | Local file uploads directory |

### 4. Authentication & Security
| Variable | Type | Default | Required? | Description |
| :--- | :---: | :---: | :---: | :--- |
| `JWT_SECRET` | String | *(Dev Secret)* | **Required in Prod** | 32-byte secret key for signing JWT tokens |
| `JWT_ISSUER` | String | `kirmya-auth-service` | Optional | Token issuer claim (`iss`) |
| `JWT_EXPIRATION` | Duration | `24h` | Optional | Access token lifetime |
| `REFRESH_TOKEN_EXPIRATION` | Duration | `168h` (7d) | Optional | Refresh token lifetime |
| `SESSION_SECRET` | String | *(Dev Secret)* | Required | Cookie session encryption key |
| `COOKIE_SECURE` | Bool | `false` | Required in Prod | Enforce HTTPS-only cookies |
| `COOKIE_SAME_SITE` | String | `Lax` | Optional | Cookie SameSite policy (`Lax`, `Strict`, `None`) |

### 5. Database Configuration (PostgreSQL)
| Variable | Type | Default | Required? | Description |
| :--- | :---: | :---: | :---: | :--- |
| `DATABASE_URL` | String | *(Local Postgres URI)* | **Required in Prod** | Single connection string URI |
| `DATABASE_HOST` | String | `localhost` | Optional | PostgreSQL host |
| `DATABASE_PORT` | String | `5432` | Optional | PostgreSQL port |
| `DATABASE_NAME` | String | `kirmya` | Optional | Database name |
| `DATABASE_POOL_SIZE` | Int | `25` | Optional | Max connection pool size |
| `DATABASE_REPLICA_URL_1` | String | `""` | Optional | Read Replica #1 URI for read/write splitting |

### 6. Optional Platform Services & Fallback Behavior
| Service | Environment Variable | Required? | Fallback Behavior |
| :--- | :--- | :---: | :--- |
| **Redis** | `REDIS_URL` or `REDIS_HOST` | Optional | Automatically degrades to **In-Memory Thread-Safe Cache** |
| **NATS** | `NATS_URL` | Optional | Automatically degrades to **In-Process Goroutine EventBus** |
| **OpenSearch** | `OPENSEARCH_ENDPOINT` | Optional | Automatically degrades to **PostgreSQL GIN Full-Text Search** |
| **OpenTelemetry** | `OTEL_EXPORTER_OTLP_ENDPOINT` | Optional | Tracing is **disabled silently without errors** |

---

## 🚀 Deployment Instructions

### Local Development
1. Copy template:
   ```bash
   cp .env.example .env
   ```
2. Start Golang backend:
   ```bash
   go run ./cmd/kirmya/main.go
   ```

### Docker & Docker Compose
Docker Compose automatically injects `.env` variables:
```bash
docker-compose up -d --build
```

### Railway Deployment (Backend & DB)
Add `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, and `PORT` in Railway Service Variables dashboard.

### Vercel Deployment (Frontend)
Configure `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` in Vercel Environment Settings.
