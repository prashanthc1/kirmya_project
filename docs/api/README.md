# Kirmya REST API Architecture & OpenAPI Documentation Hub

Welcome to the REST API Standards, Modular Route Ownership, OpenAPI 3.0 Specifications, Swagger UI Guidelines, and Developer Experience for Kirmya.

## Documentation Index

- [`api-audit.md`](api-audit.md): Complete audit of all REST endpoints, parameters, authentication, and error models.
- [`api-architecture.md`](api-architecture.md): Modular route ownership pattern, Gin handler composition, and DTO contracts.
- [`api-reference.md`](api-reference.md): Endpoint reference directory, resource paths, and authorization rules.
- [`api-style-guide.md`](api-style-guide.md): HTTP method conventions, REST URI naming, and field naming standards.
- [`api-security.md`](api-security.md): Server-authoritative ownership scoping, input validation, and normalized errors.
- [`error-catalog.md`](error-catalog.md): Centralized error code taxonomy, status mappings, and JSON error contracts.
- [`openapi.md`](openapi.md): Authoritative OpenAPI 3.0 specification generator and Swagger UI configuration.
- [`pagination.md`](pagination.md): Keyset/cursor and offset pagination response schemas.
- [`rate-limiting.md`](rate-limiting.md): Token bucket rate limit tiers (Auth, Search, Messages, General).
- [`idempotency.md`](idempotency.md): `Idempotency-Key` headers and deduplication mechanics.
- [`webhooks.md`](webhooks.md): HMAC-SHA256 signature verification and webhook dispatch rules.
- [`api-versioning.md`](api-versioning.md): URI versioning strategy (`/api/v1`) and non-breaking contract evolution.
- [`deprecation.md`](deprecation.md): RFC-8594 `Deprecation` and `Sunset` headers policy.
- [`api-change-policy.md`](api-change-policy.md): Breaking vs non-breaking change definitions and backward compatibility guarantees.
- [`developer-guide.md`](developer-guide.md): Quickstart guide for frontend and third-party API integration.
- [`api-operations-runbook.md`](api-operations-runbook.md): SRE operations runbook for rate limiting, latency triage, and error recovery.
