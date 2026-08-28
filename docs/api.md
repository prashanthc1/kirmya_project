# Kirmya REST API Architecture, OpenAPI/Swagger & Contract Specification

## 1. REST API Architecture Overview

The Kirmya Platform provides a uniform, strictly authorized RESTful API ecosystem. All routes are modularly registered within domain packages (`internal/<module>/delivery/http/`) and bound to the central Gin router in `internal/router/router.go`.

```
Client (Next.js / TypeScript / Mobile)
        │
        ▼
[Gin Router & Middleware Pipeline] (CORS, Request ID, Rate Limiter, Auth JWT)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
/api/v1/auth/*                 /api/v1/jobs/*                /api/v1/messages/*
(Public / Auth Tokens)         (Job Directory / ATS)         (Chat / WebSockets)
        │                             │                             │
        ▼                             ▼                             ▼
/api/v1/profile/*              /api/v1/communities/*         /health/*
(Career Identity)              (Groups / Discussions)        (Kubernetes Probes)
```

---

## 2. Standardized Error Response Contract

All error responses across the API follow a deterministic structure:

```json
{
  "error": "Human-readable safe error message",
  "code": "ERROR_CODE_IDENTIFIER",
  "correlation_id": "req-uuid-or-trace-id",
  "details": {}
}
```

### Standard HTTP Status Codes:
- `200 OK`: Successful synchronous retrieval or state modification.
- `201 Created`: Resource successfully created (e.g. `POST /api/v1/jobs`).
- `204 No Content`: Successful deletion or state change with no response body.
- `400 Bad Request`: Input validation failure or malformed JSON payload.
- `401 Unauthorized`: Missing or invalid Bearer JWT token.
- `403 Forbidden`: Authenticated user lacks required role/resource ownership.
- `404 Not Found`: Targeted resource does not exist or is hidden by privacy settings.
- `409 Conflict`: Business invariant collision (e.g. duplicate application).
- `429 Too Many Requests`: Rate limit threshold exceeded.
- `503 Service Unavailable`: Critical dependency offline (e.g. `/health/ready`).

---

## 3. Module-to-Route Directory

| Module | Route Prefix | Auth Requirement | Core Endpoints |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/v1/auth` | Public / Bearer | `register`, `login`, `refresh`, `logout`, `verify-email`, `reset-password`, `me` |
| **Profile** | `/api/v1/profile` | Bearer Token | `get`, `update`, `experiences`, `educations`, `skills`, `certifications`, `visibility` |
| **Resume** | `/api/v1/resume` | Bearer Token | `upload`, `download/:id`, `delete/:id`, `ats-score` |
| **Jobs** | `/api/v1/jobs` | Public / Bearer | `search`, `get/:id`, `create`, `update/:id`, `close/:id`, `save/:id` |
| **ATS** | `/api/v1/applications` | Bearer Token | `apply`, `my-applications`, `status/:id`, `stage-transition` |
| **Recruiter** | `/api/v1/recruiter` | Recruiter Role | `dashboard`, `candidates`, `scorecards`, `notes`, `talent-pools` |
| **Community** | `/api/v1/communities` | Bearer Token | `list`, `get/:id`, `join`, `leave`, `posts`, `events`, `moderation` |
| **Networking**| `/api/v1/network` | Bearer Token | `search`, `requests`, `connections`, `recommendations`, `blocks` |
| **Messaging** | `/api/v1/messages` | Bearer Token | `conversations`, `send`, `history`, `read`, `ws` (WebSocket) |
| **Notifications** | `/api/v1/notifications` | Bearer Token | `list`, `unread-count`, `mark-read`, `preferences` |
| **Admin** | `/api/v1/admin` | Admin RBAC | `system/health`, `users`, `reports`, `moderation`, `impersonate`, `audit-logs` |
| **Compliance**| `/api/v1/compliance` | Bearer Token | `dsr/export`, `account/delete`, `consent`, `legal-holds` |
| **Billing** | `/api/v1/billing` | Public / Bearer | `status`, `plans`, `checkout`, `webhooks/:provider` |
| **Health** | `/health` | Public | `live`, `ready`, `startup`, `status` |

---

## 4. Swagger & OpenAPI 3.0 Documentation

- Authoritative schema located in `internal/docs/swagger.json`.
- Interactive Swagger UI served at `/swagger/index.html` and redirected from `/docs` when `SWAGGER_ENABLED=true`.
- Protected in production environments via optional HTTP Basic Authentication (`SWAGGER_USERNAME` / `SWAGGER_PASSWORD`).
