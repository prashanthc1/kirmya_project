# Kirmya API Platform & Developer Documentation

Welcome to the REST API Platform, OpenAPI Specification, Error Catalog, and Integration documentation for Kirmya.

## Documentation Index

- [`api-audit.md`](api-audit.md): Complete audit of REST routes, middleware chain, and response envelopes.
- [`api-style-guide.md`](api-style-guide.md): Naming conventions, DTO isolation, and ISO 8601 formatting.
- [`api-versioning.md`](api-versioning.md): Path-based versioning prefix (`/api/v1`) and deprecation headers.
- [`error-catalog.md`](error-catalog.md): Centralized error code catalog and HTTP status mapping.
- [`pagination.md`](pagination.md): Page index, page size caps, and SQL injection defense.
- [`rate-limiting.md`](rate-limiting.md): Rate limit tiers, threshold limits, and response headers.
- [`idempotency.md`](idempotency.md): `Idempotency-Key` header mechanics and replay protection.

## Swagger UI & OpenAPI Specification

- Swagger UI Endpoint: `/swagger/index.html` (Available in non-production or when `SWAGGER_ENABLED=true`).
- Spec Validation Command: `make swagger-validate` in `backend/`.
