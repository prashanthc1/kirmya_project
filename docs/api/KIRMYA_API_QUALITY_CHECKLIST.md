# Kirmya API Quality & Standardization Checklist

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: OPERATIONAL QUALITY GATE  

---

## Endpoint Implementation Gate

Every route mounted in Kirmya must satisfy all criteria before release:

* [x] **Route Architecture**: Route belongs to a dedicated module in `internal/<domain>/delivery/http/routes.go`.
* [x] **HTTP Method**: Uses correct semantic verb (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
* [x] **Authentication**: Protected routes require `middleware.AuthRequired()`.
* [x] **Authorization & RBAC**: Privileged routes apply `middleware.RequireRole(...)` or `middleware.RequireAdmin()`.
* [x] **Context Extraction**: User identity extracted from validated JWT claims (`middleware.GetUserID(c)`).
* [x] **Input Validation**: Request body bound to dedicated request DTO with format validation.
* [x] **Output Sanitization**: Response returned as dedicated DTO, stripping passwords, hashes, and internal secrets.
* [x] **Pagination**: Listing routes enforce capped pagination via `normalizePage` (limit $\le 100$).
* [x] **Error Envelope**: Error responses formatted as `{"error": "...", "code": "..."}`.
* [x] **Swagger Annotations**: Fully documented with Swag comments (`@Summary`, `@Tags`, `@Success`, `@Failure`).
* [x] **Golden File Locking**: Verified in `internal/router/testdata/routes.golden`.
* [x] **Unit & Contract Testing**: Covered by automated tests in `test/contract/` and domain test suites.
