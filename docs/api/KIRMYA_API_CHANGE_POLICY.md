# Kirmya API Change Policy & Deprecation Protocol

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: ACTIVE GOVERNANCE POLICY  

---

## 1. Non-Breaking Change Rules (Backward Compatible)

The following changes are considered **backward-compatible** and may be deployed within `/api/v1` without a major version bump:
1. Adding new optional request query parameters or fields in request JSON bodies.
2. Adding new fields in API response JSON payloads (clients must ignore unknown fields).
3. Adding new endpoints under existing or new module routes.
4. Adding new allowed enum values (provided clients treat unrecognized enum values gracefully).

---

## 2. Breaking Change Rules & Versioning

The following changes are **breaking** and strictly forbidden within an active API version:
1. Renaming or removing existing endpoints or HTTP methods.
2. Renaming or deleting fields in request or response payloads.
3. Changing field data types (e.g. integer $\to$ string).
4. Making an optional request field mandatory.
5. Altering the semantics of an existing HTTP status code.

---

## 3. Deprecation Lifecycle & Golden File Workflow

When an endpoint is marked for deprecation:
1. Mark route with `@deprecated` in Go delivery docstrings.
2. Return response header: `Deprecation: @<timestamp>`.
3. Support the deprecated endpoint for a minimum of **90 days**.
4. Update the router golden file:
   ```bash
   $env:KIRMYA_UPDATE_GOLDEN="1"; go test ./internal/router/...
   ```
5. Regenerate Swagger documentation:
   ```bash
   make swagger
   ```
