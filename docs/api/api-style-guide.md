# Kirmya API Style Guide & Conventions

## 1. URL Naming Conventions
- Use plural nouns for resource collections: `/api/v1/jobs`, `/api/v1/communities`, `/api/v1/notifications`.
- Use kebab-case for multi-word path segments: `/api/v1/job-alerts`, `/api/v1/data-governance`.
- Use HTTP verbs appropriately: `GET` (retrieve), `POST` (create), `PUT` (full update), `PATCH` (partial update), `DELETE` (remove).

---

## 2. DTO Serialization & Isolation
- **No Direct Entity Exposure**: Database models (e.g. `gorm.Model` or raw SQL structs) are mapped to explicit DTO structs before JSON serialization.
- **Sensitive Field Stripping**: Password hashes (`password_hash`), MFA secrets (`totp_secret`), and API secret keys are tagged with `json:"-"` and never returned in API payloads.
- **Timestamp Formatting**: All dates and timestamps use ISO 8601 / RFC 3339 in UTC format (e.g. `2026-08-22T18:16:30Z`).
