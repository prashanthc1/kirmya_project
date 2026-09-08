# Kirmya — AI-Powered Career Companion & Professional Hiring Platform

[![Backend CI](https://img.shields.io/badge/Backend-Go%201.26%20%7C%20Gin-00ADD8.svg)](backend/)
[![Frontend CI](https://img.shields.io/badge/Frontend-Next.js%2016%20%7C%20MUI%20v6-000000.svg)](frontend/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016%20(98%20Migrations)-336791.svg)](backend/scripts/migrations/)
[![Cache & Realtime](https://img.shields.io/badge/Broker-Redis%207-DC382D.svg)](backend/internal/messaging/pubsub/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6.svg)](frontend/)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](#)

Kirmya is an enterprise-grade, modular career companion and talent platform connecting candidates, recruiters, employers, and professional communities. Engineered as a high-performance **Modular Monolith** in Golang and Next.js, Kirmya provides verifiable ATS pipelines, real-time messaging, privacy-first data lifecycles, and accessible Glassmorphic interfaces.

---

## 🚀 Platform Status (September 2026)

- **Release Milestone**: **Core Beta Verified** (Hiring Loop, ATS, Identity, Privacy, SEO, Accessibility, Redis Realtime Broker).
- **Public Launch Status**: **HOLD** pending vertical expansion of Step 10 (AI external providers, assessments/freelance lifecycles, and mobile devices).
- **Backend Quality**: 100% test pass rate across all 200+ domain packages (`go test ./...`).
- **Database Schema**: 98 PostgreSQL migrations (`0001` to `0096`), enforced by advisory locks and automated repository schema conformance tests.
- **Frontend Quality**: 0 ESLint errors, 0 TypeScript errors, 567/567 Vitest tests passing, and 100% Next.js static/dynamic route compilation.

---

## 🏗️ Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│             Web Client (Next.js 16 + TypeScript)            │
│         MUI v6 Design System · Glassmorphic Styling         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / WSS / REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Golang Monolith (Gin Gonic)                 │
│   Middleware: Auth JWT · Distributed Lua Rate Limiter · CORS │
└──────┬───────────────────────┬───────────────────────┬──────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐        ┌──────────────┐
│  PostgreSQL  │       │    Redis     │        │  S3 / MinIO  │
│  Version 16  │       │  Pub/Sub &   │        │ Resume PDFs  │
│98 Migrations │       │  Rate Limits │        │ & Documents  │
└──────────────┘       └──────────────┘        └──────────────┘
```

### Backend (`backend/`)
- **Language**: Go 1.26.8
- **Web Framework**: Gin Gonic (`github.com/gin-gonic/gin`)
- **Database Driver**: `pgx/v5` (`github.com/jackc/pgx/v5/pgxpool`)
- **Cache & Realtime**: `go-redis/v9` for pub/sub message broadcasting and Lua token-bucket rate limiting
- **Security**: JWT (`golang-jwt/jwt/v5`), Bcrypt cost 12, TOTP MFA, SameSite cookie protection
- **Architecture**: Modular Monolith following `Delivery (HTTP) → Service (Domain) → Repository (PostgreSQL)`.

### Frontend (`frontend/`)
- **Framework**: Next.js 16.3.0 (Turbopack, App Router)
- **UI Library**: Material UI v6 (`@mui/material`), Emotion, Framer Motion
- **Design Paradigm**: Custom Glassmorphism design tokens (strictly **No Tailwind CSS**)
- **State & Data Fetching**: `@tanstack/react-query`, Axios with centralized authenticated interceptor
- **Validation**: React Hook Form with Zod schemas

---

## 📁 Repository Structure

```
my_project/
├── backend/
│   ├── cmd/kirmya/          # Application entrypoint & composition root
│   ├── internal/            # 57 domain modules (auth, jobs, recruiter, etc.)
│   ├── scripts/migrations/  # 98 sequential PostgreSQL migrations (0001-0096)
│   └── test/                # Integration, contract, reliability, security suites
├── frontend/
│   ├── src/app/             # Next.js App Router pages (candidates, recruiters, admin)
│   ├── src/components/      # Reusable MUI Glassmorphism components
│   ├── src/features/        # Domain state, services, and types
│   ├── src/theme/           # WCAG AA compliant light/dark theme tokens
│   └── src/test/            # Vitest unit & component test suites
├── docs/                    # Complete architectural, operational, and audit docs
├── test/e2e/                # Playwright browser end-to-end test suites
└── docker-compose.yml       # Local development services (PostgreSQL + Redis)
```

---

## 🛠️ Getting Started & Local Development

### Prerequisites
- **Go**: 1.26+
- **Node.js**: 24.16+ (npm 11.13+)
- **PostgreSQL**: 16+
- **Redis**: 7+

### 1. Database & Environment Setup
Copy the environment template and initialize credentials:
```bash
cp .env.example .env
```
Ensure PostgreSQL is running locally with database `kirmya_project`.

### 2. Backend Execution
```bash
cd backend
go mod download
go run cmd/kirmya/main.go
```
*Note: On boot, the auto-migration runner automatically executes all pending migrations under PostgreSQL advisory locking.*

### 3. Frontend Execution
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing & Verification Suite

Execute verification commands across the entire platform:

### Backend Tests
```bash
# Run all unit, security, integration, and contract test suites
cd backend
go test ./...

# Run automated schema conformance test against live PostgreSQL
go test -tags=ciintegration -run TestRepositorySQLMatchesTheSchema ./test/ci

# Build compilation check
go build ./...
```

### Frontend Tests & Typecheck
```bash
cd frontend

# TypeScript type generation & checking (0 errors)
npm run typecheck

# Vitest test suite (567/567 passed)
npm run test

# ESLint lint check (0 errors)
npm run lint

# Production Next.js build
npm run build
```

### End-to-End Browser Tests
```bash
# Run Playwright E2E suites across Chromium, Firefox, WebKit, and Mobile Viewports
npm run test:e2e
```

---

## 📚 Documentation Index

For in-depth architectural specifications, guides, and runbooks, refer to the [`docs/`](docs/) directory:
- [**Documentation Hub**](docs/README.md): Central directory of all documentation
- [**Platform Walkthrough**](docs/walkthrough.md): Comprehensive implementation and verification overview
- [**Backend Architecture**](docs/backend-architecture.md): Layering, dependency injection, and module extraction
- [**Database Schema & Migrations**](docs/database.md): Relational architecture, indexes, and concurrency controls
- [**REST API & OpenAPI 3.0**](docs/api.md): API contract, standardized error formats, and Swagger documentation
- [**Project Completion Plan**](docs/PROJECT_COMPLETION_PLAN_2026-09-06.md): Step-by-step audit remediation roadmap and delivery evidence
- [**Batch 5 Delivery Evidence**](docs/BATCH5_DELIVERY_EVIDENCE_2026-09-08.md): List contract repairs, schema conformance, and sample data removal
