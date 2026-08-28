# Kirmya API Platform & REST Governance Audit

## Executive Summary
This document provides a comprehensive audit of the REST API architecture, routing modularity, DTO validation, OpenAPI 3.0 specification alignment, error handling, rate limiting, and versioning standards across all 45 domain modules in Kirmya.

---

## 1. REST API Architecture Overview

```
Client Request (HTTP / TLS 1.3)
      │
      ▼
Middleware Chain (CORS, RateLimit, RequestID, SecurityHeaders, OTEL)
      │
      ▼
Module Route Group (/api/v1/[module])
      │
      ▼
Delivery Handler (Request Binding, Validation, DTO Construction)
      │
      ▼
Service Layer (RBAC, Business Logic, IDOR Checks, Privacy Safeguards)
      │
      ▼
Repository Layer (SQL Queries, pgxpool, Memory Fallback)
      │
      ▼
Response Envelope (HTTP Status, Structured JSON Payload)
```

---

## 2. API Domain Modules & Route Registration Audit

| Domain Module | Route File Location | Base Prefix | Auth Requirement | Validation & DTO Status | Swagger Docs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth & Security** | `internal/auth/delivery/http/routes.go` | `/api/v1/auth`, `/api/v1/security` | Public & Bearer JWT | Strict binding & regex validation | Fully Documented |
| **Profiles & Resumes** | `internal/profile/delivery/http/routes.go` | `/api/v1/profile`, `/api/v1/resumes` | Bearer JWT | DTO bounds on strings & arrays | Fully Documented |
| **Job Market & Matching** | `internal/jobs/delivery/http/routes.go` | `/api/v1/jobs`, `/api/v1/ai-job-match`| Public & Bearer JWT | Query params parsed with defaults | Fully Documented |
| **Applicant Tracking (ATS)**| `internal/applications/delivery/http/routes.go`| `/api/v1/applications` | Bearer JWT (Candidate/Recruiter) | Status transition state machine | Fully Documented |
| **Recruiter & Employer** | `internal/company/delivery/http/routes.go` | `/api/v1/employer`, `/api/v1/company` | Recruiter/Employer RBAC | Organization ID tenant scoping | Fully Documented |
| **Communities & Groups** | `internal/community/delivery/http/routes.go` | `/api/v1/communities` | Public & Bearer JWT | Membership & moderation roles | Fully Documented |
| **Direct Messaging** | `internal/messaging/delivery/http/routes.go` | `/api/v1/messages` | Bearer JWT | Participant ID verification & WS | Fully Documented |
| **Networking & Connections**|`internal/networking/delivery/http/routes.go`| `/api/v1/network`, `/api/v1/people` | Bearer JWT | 1st-degree connection rules | Fully Documented |
| **Notifications** | `internal/notification/delivery/http/routes.go`| `/api/v1/notifications` | Bearer JWT | Idempotency key deduplication | Fully Documented |
| **Mentorship & Learning** | `internal/mentorship/delivery/http/routes.go` | `/api/v1/mentorship`, `/api/v1/learning`| Bearer JWT | Session status validation | Fully Documented |
| **Search & Discovery** | `internal/search/delivery/http/routes.go` | `/api/v1/search` | Public & Bearer JWT | OpenSearch + SQL fallback | Fully Documented |
| **Analytics & Reporting** | `internal/analytics/delivery/http/routes.go` | `/api/v1/analytics`, `/api/v1/admin/analytics`| Bearer JWT / Admin RBAC | Min privacy threshold = 5 | Fully Documented |
| **Compliance & Privacy** | `internal/compliance/delivery/http/routes.go` | `/api/v1/privacy`, `/api/v1/compliance` | Bearer JWT / Admin RBAC | Legal hold blocking & sanitization | Fully Documented |
| **Admin & Governance** | `internal/admin/delivery/http/routes.go` | `/api/v1/admin` | Super Admin / Moderator RBAC | Append-only audit logging | Fully Documented |

---

## 3. Standard API Response Contracts

### 3.1 Success Response Envelopes
All REST endpoints return standard HTTP status codes (`200 OK`, `201 Created`, `204 No Content`) with structured JSON representations:
```json
{
  "data": {
    "id": "7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
    "title": "Senior Cloud Infrastructure Engineer",
    "status": "active"
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 42,
    "totalPages": 3,
    "hasNext": true
  }
}
```

### 3.2 Error Response Envelopes
All error responses adhere to the standard JSON error schema with no implementation details, internal traces, or SQL leakage:
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid request attributes provided",
    "details": [
      {
        "field": "targetCount",
        "code": "MIN_VALUE_REQUIRED",
        "message": "Target count must be greater than zero"
      }
    ],
    "requestId": "e2a74c18-a1cc-4900-be92-5a48dd963cb5"
  }
}
```

---

## 4. HTTP Status Code Standardization Matrix

| Status Code | Semantic Meaning | Usage Context Across Kirmya |
| :--- | :--- | :--- |
| `200 OK` | Standard successful response | Data retrieval (`GET`), in-place updates (`PUT`), successful search queries |
| `201 Created` | Resource created | Profile items, jobs, applications, messages, connections, communities |
| `202 Accepted` | Asynchronous processing queued | Data export compilation, background retention runs, report generation |
| `204 No Content` | Success with no payload | Resource deletions (`DELETE`), heartbeat probes, CORS preflight (`OPTIONS`) |
| `400 Bad Request` | Malformed syntax / bad JSON | Invalid JSON structure, malformed UUID, missing required request fields |
| `401 Unauthorized` | Missing or invalid auth | Missing Bearer header, expired JWT token, revoked user session |
| `403 Forbidden` | Access denied / IDOR failure | Attempting to edit another user's profile, non-admin accessing `/admin` |
| `404 Not Found` | Resource not found | Non-existent job ID, user profile, community, or application |
| `409 Conflict` | Business constraint violation | Account deletion under active legal hold, duplicate email registration |
| `422 Unprocessable` | Semantic validation failed | Out-of-bounds dates, invalid enum values, target role exceeds max length |
| `429 Too Many Req`| Rate limit exceeded | Auth brute-force triggers, search flood triggers, messaging spam caps |
| `500 Server Error` | Internal server exception | Unhandled database connection failures, sanitized generic error |
| `503 Unavailable` | System under maintenance | System-wide maintenance mode enabled by administrator |

---

## 5. Security & Authorization Governance
1. **Server-Authoritative Identity**: The user's ID is always extracted from the verified JWT context (`c.Get("userID")`), never accepted from mutable request parameters or request bodies.
2. **Multi-Tenant Scoping**: All recruiter and employer queries filter by `WHERE organization_id = $1` to guarantee complete tenant isolation.
3. **Mass Assignment Prevention**: Handlers bind strictly to explicit DTO structs rather than database model entities.
4. **Zero Raw Secret Exposure**: Password hashes, MFA secrets, and API master keys are explicitly excluded from all JSON serializations (`json:"-"`).
