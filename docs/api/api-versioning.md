# Kirmya API Versioning & Evolution Strategy

## 1. Versioning Strategy
- **Path-Based Prefix**: Primary versioning via URL prefix `/api/v1/...`.
- **Non-Breaking Changes**: Adding optional parameters or new fields to existing response JSON payloads does NOT trigger a major version bump.
- **Breaking Changes**: Field removals, attribute type alterations, or URL restructurings require a new version prefix (e.g. `/api/v2/...`) with a 6-month deprecation grace period.

---

## 2. API Deprecation Headers
When an API endpoint is marked for deprecation:
- `Sunset`: Specifies date of planned endpoint retirement (e.g. `Sunset: Wed, 31 Dec 2026 23:59:59 GMT`).
- `Deprecation`: Signals deprecation notice (`Deprecation: true`).
- `Link`: Points to API migration documentation.
