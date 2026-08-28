# Kirmya API Versioning & Evolution Policy

## 1. Versioning Strategy

Kirmya utilizes **URI Path Versioning** under `/api/v1/`.

### Guarantees of `/api/v1`:
- **Additive Non-Breaking Changes**: Adding new fields to response JSON payloads, adding optional query parameters, or introducing new endpoints within existing namespaces is non-breaking and does not bump the URI version.
- **Breaking Change Definition**: Removing fields, renaming fields, altering field data types, modifying existing error codes, or requiring new mandatory parameters are considered breaking changes.

---

## 2. Deprecation & Sunset Lifecycle

When an API endpoint or parameter is scheduled for retirement, Kirmya follows RFC-8594 standard HTTP response headers:

- `Deprecation`: RFC 8594 timestamp when deprecation took effect (e.g. `Deprecation: @1740700800`).
- `Sunset`: RFC 8594 date when the endpoint will be permanently decommissioned (e.g. `Sunset: Wed, 01 Jul 2026 00:00:00 GMT`).
- `Link`: Link header directing developers to migration guides.

```http
HTTP/1.1 200 OK
Content-Type: application/json
Deprecation: @1740700800
Sunset: Wed, 01 Jul 2026 00:00:00 GMT
Link: <https://docs.kirmya.com/api/v1/migration>; rel="deprecation"
```

---

## 3. Backwards Compatibility for Legacy Groups

For client transition safety, legacy route groups (e.g. `/api/v1/profiles/`, `/api/v1/messaging/`, `/api/v1/networking/`) are routed to the canonical handlers (`/api/v1/profile/`, `/api/v1/messages/`, `/api/v1/network/`) without behavioral divergence.
