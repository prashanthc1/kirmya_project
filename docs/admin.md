# Kirmya Admin Dashboard, Platform Operations & System Management System

## Overview
The Admin Dashboard & Platform Operations System provides centralized, role-based administrative control over the entire Kirmya platform. It enforces server-side Role-Based Access Control (RBAC), fine-grained authorization, append-only immutable audit logging, Trust & Safety moderation, background worker monitoring, platform health checks, feature flag rollouts, incident management, support impersonation safeguards, and system configuration.

---

## Technical Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │           Next.js + MUI v6 UI                │
                               │        (/admin, /admin/users, etc.)          │
                               └──────────────────────┬───────────────────────┘
                                                      │ REST HTTP (JSON)
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │            Gin HTTP Engine                   │
                               │   internal/admin/delivery/http/routes.go     │
                               └──────────────────────┬───────────────────────┘
                                                      │ Context / Auth RBAC
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │            Admin Service Layer               │
                               │    internal/admin/service/admin_service.go   │
                               └──────┬───────────────┬───────────────┬───────┘
                                      │               │               │
                     ┌────────────────┴─┐           ┌─┴──────────────┐│
                     ▼                  ▼           ▼                ▼
            ┌────────────────┐  ┌─────────────┐  ┌──────┐  ┌────────────────┐
            │ PostgreSQL DB  │  │ Redis Cache │  │ NATS │  │ OpenTelemetry  │
            │  (Source of    │  │ (Aggregates │  │(Bus) │  │ (Observability │
            │    Truth)      │  │  & Limits)  │  └──────┘  │  & Health)     │
            └────────────────┘  └─────────────┘            └────────────────┘
```

---

## Administrative Roles & Permission Matrix

Access control is governed by server-side RBAC tokens across 7 predefined roles:

| Admin Role | Permissions Granted |
| :--- | :--- |
| **Super Admin** | Full platform authority (`*`), RBAC role assignments, System Settings, Feature Flags, Maintenance Mode, Audit Logs |
| **Platform Admin** | User management, company status, job moderation, feature flags, background job retries |
| **Trust & Safety Admin**| Moderation queue, report resolution, user restriction/suspension/ban, account flags, risk scoring |
| **Content Moderator** | Job moderation, community posts/comments moderation, content reports review |
| **Support Admin** | Support user lookup, support notes, temporary support impersonation (with 15-min auto-expire & mandatory reason) |
| **Analytics Admin** | Platform growth trends, aggregate engagement analytics, system health metrics |
| **Operations Admin**| Infrastructure health monitoring, Redis/NATS/OpenSearch metrics, background worker management, incidents |

---

## Core Operational Components

### 1. Moderation & Trust & Safety Queue (`/admin/moderation`, `/admin/reports`)
- **Risk Score Aggregation**: Surface high-risk users, companies, and jobs based on repeated report signals, suspicious posting patterns, duplicate content, and wire transfer scam keywords.
- **Moderation Actions**: Approve, Reject, Hide, Remove, Suspend, Restore, and Flag with mandatory moderator audit reasons.

### 2. Support Impersonation Protocol (`POST /api/v1/admin/users/:id/impersonate`)
- Strict security constraints:
  1. Requires explicit support admin authorization.
  2. Requires a mandatory support ticket reason.
  3. Creates an isolated temporary session expiring strictly after 15 minutes.
  4. Never exposes passwords, OAuth secrets, or JWT private keys.
  5. Automatically logs an immutable `USER_IMPERSONATION_STARTED` event in the audit record.

### 3. Background Job Engine (`/admin/system/jobs`)
- Real-time visibility into asynchronous workers processing analytics aggregation, search reindexing, data export generation, and notification dispatching.
- Supports safe idempotent job retry actions (`POST /api/v1/admin/system/jobs/:id/retry`).

### 4. Append-Only Immutable Audit Trail (`/admin/audit-logs`)
- Every administrative state change (role changes, account restrictions, moderation decisions, feature flag updates, system setting edits) records:
  - Admin ID & Email
  - Target Type & Target ID
  - Previous State & New State JSON maps
  - Mandatory reason
  - IP address, User-Agent, Request ID, and Timestamp.
- Audit logs are strictly append-only; modification or deletion endpoints are explicitly omitted.

### 5. Platform Health & Infrastructure (`/admin/system/health`)
- Monitor liveness, readiness, latency, and operational health across API services, PostgreSQL pool, Redis cache, OpenSearch indexer, NATS event bus, background workers, and OpenTelemetry collector.

---

## OpenAPI 3.0 Administrative Endpoint Specifications

- `GET /api/v1/admin/dashboard` - High-level executive statistics
- `GET /api/v1/admin/users` - Searchable & paginated user directory
- `GET /api/v1/admin/users/:id` - Detailed user profile & security audit log
- `PUT /api/v1/admin/users/:id/status` - Restrict, suspend, or restore user account
- `POST /api/v1/admin/users/:id/impersonate` - Generate temporary 15-min support session
- `GET /api/v1/admin/roles` - View system roles & permission matrix
- `POST /api/v1/admin/roles/assign` - Assign admin role to user
- `GET /api/v1/admin/jobs` - Job moderation directory
- `POST /api/v1/admin/jobs/:id/moderate` - Execute moderation action on job listing
- `GET /api/v1/admin/reports` - Content report queue
- `PUT /api/v1/admin/reports/:id/resolve` - Resolve, dismiss, or escalate report
- `GET /api/v1/admin/audit-logs` - Query immutable audit log records
- `GET /api/v1/admin/system/health` - Platform infrastructure health status
- `GET /api/v1/admin/system/jobs` - Background workers and queued tasks
- `POST /api/v1/admin/system/jobs/:id/retry` - Trigger worker task retry
- `GET /api/v1/admin/feature-flags` - Rollout feature flag list
- `POST /api/v1/admin/feature-flags` - Create or update feature flag
- `POST /api/v1/admin/settings/maintenance` - Schedule or toggle platform maintenance mode
- `GET /api/v1/admin/incidents` - Platform incident tracking status
