# Kirmya API Error Code Catalog & Status Reference

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: STANDARDIZED REFERENCE  

---

## 1. Standard Error Envelope

Every failed API call returns a standardized JSON error envelope:
```json
{
  "error": "human_readable_or_safe_error_summary",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "trace_id": "3da6eb30-a0a2-4858-a13e-60637777acc8"
}
```

---

## 2. Machine-Readable Error Code Catalog

### Authentication & Identity (`401 Unauthorized` / `403 Forbidden`)
* `AUTH_INVALID_CREDENTIALS`: Email and password combination is invalid.
* `AUTH_TOKEN_EXPIRED`: JWT bearer token has expired.
* `AUTH_TOKEN_INVALID`: JWT token signature is corrupt or tampered.
* `AUTH_ACCOUNT_LOCKED`: Account is locked or suspended by platform administrators.
* `AUTH_EMAIL_UNVERIFIED`: Action requires verified email address.
* `AUTH_UNAUTHORIZED`: Request missing `Authorization` header.

### Authorization & RBAC (`403 Forbidden`)
* `RBAC_FORBIDDEN`: User lacks the required role (e.g. candidate attempting recruiter endpoint).
* `TENANT_ACCESS_DENIED`: User does not belong to the target company or enterprise organization.
* `RESOURCE_FORBIDDEN`: Attempting to mutate a resource owned by another user (IDOR prevention).

### Validation & Client Requests (`400 Bad Request` / `422 Unprocessable Entity`)
* `VALIDATION_FAILED`: Request payload failed schema validation (missing required field, invalid format).
* `INVALID_UUID`: Path or query parameter is not a valid UUID v4.
* `INVALID_PAGE_PARAMETERS`: `page` or `limit` parameter is out of bounds.
* `PAYLOAD_TOO_LARGE`: Request body exceeds the maximum allowable size (5MB for file uploads).
* `UNSUPPORTED_MEDIA_TYPE`: Uploaded file MIME type or extension is not allowlisted.

### Resource State & Conflicts (`404 Not Found` / `409 Conflict`)
* `RESOURCE_NOT_FOUND`: Target entity (job, user, application, community) does not exist.
* `DUPLICATE_RESOURCE`: Resource already exists (e.g. duplicate email registration, duplicate application).
* `CONNECTION_ALREADY_EXISTS`: Connection request already active between participants.
* `CONVERSATION_ALREADY_EXISTS`: Conversation thread already initiated.

### Rate Limiting & System Availability (`429 Too Many Requests` / `500` / `503`)
* `RATE_LIMITED`: Per-IP request limit exceeded (inspect `Retry-After` response header).
* `DATABASE_UNAVAILABLE`: PostgreSQL connection pool saturated or unreachable.
* `SERVICE_DEGRADED`: Downstream optional provider (SMTP, external AI) unavailable; degraded mode active.
* `INTERNAL_SERVER_ERROR`: Unhandled server error intercepted by recovery middleware.
