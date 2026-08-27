# Kirmya API Platform & Governance Documentation

Welcome to the REST API Architecture, OpenAPI/Swagger Specifications, Rate Limiting, Error Catalog, and Integration Documentation for Kirmya.

## Documentation Index

- [`api-audit.md`](api-audit.md): Complete audit of endpoints, DTO contracts, middleware costs, and route registration patterns.
- [`api-style-guide.md`](api-style-guide.md): REST conventions, ISO 8601 timestamps, UUID v4 format, and response envelope standards.
- [`api-versioning.md`](api-versioning.md): `/api/v1` namespace conventions, version header rules, and backwards-compatibility standards.
- [`error-catalog.md`](error-catalog.md): Centralized machine-readable error codes (e.g. `UNAUTHORIZED`, `INVALID_INPUT`, `IDOR_FORBIDDEN`).
- [`pagination.md`](pagination.md): Cursor-based keyset pagination standards and maximum page size limits (`pageSize <= 100`).
- [`rate-limiting.md`](rate-limiting.md): Redis token-bucket rate limiting rules per IP, user, and endpoint.
- [`idempotency.md`](idempotency.md): `Idempotency-Key` processing for job applications and administrative actions.
- [`api-change-policy.md`](api-change-policy.md): Breaking vs non-breaking change criteria and 180-day deprecation windows.
- [`openapi.md`](openapi.md): Automated `swag` OpenAPI specification generation and Swagger UI setup.
- [`webhooks.md`](webhooks.md): Outbound webhook signing (HMAC-SHA256), timestamp verification, and retries.
- [`deprecation.md`](deprecation.md): Deprecation notice headers, sunset dates, and traffic monitoring.
- [`developer-guide.md`](developer-guide.md): Next.js typed API client integration, request ID tracking, and mock fallbacks.

## Interactive API Explorer

- Swagger UI: `/swagger/index.html`
- API Health & Status: `/api/v1/system/health`
- Admin API Management Desk: `/admin/api`
