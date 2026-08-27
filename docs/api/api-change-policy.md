# Kirmya API Change & Deprecation Policy

## 1. Breaking vs. Non-Breaking API Changes

### Non-Breaking Changes (Allowed in minor/patch releases)
- Adding new optional fields to request bodies or query parameters.
- Adding new fields to response payloads.
- Adding new endpoints.
- Optimizing internal query execution or response latency.

### Breaking Changes (Requires major version bump, e.g. `/api/v2/`)
- Removing or renaming an existing API endpoint or URI parameter.
- Removing or renaming fields in JSON response payloads.
- Changing data types or validation formats of existing fields.
- Modifying authentication or authorization requirements for existing routes.

---

## 2. Deprecation Lifecycle (180-Day Window)
1. **Header Announcement**: Deprecated endpoints include `Sunset: <date>` and `Deprecation: true` HTTP response headers.
2. **Swagger Annotation**: Endpoint marked `@Deprecated` in OpenAPI/Swagger documentation.
3. **Usage Monitoring**: Active callers tracked via Prometheus metric `kirmya_api_deprecated_endpoint_hits_total`.
