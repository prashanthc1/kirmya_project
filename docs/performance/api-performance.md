# Kirmya API Performance & Response Optimization

## 1. Response Optimization
- **Gzip / Brotli Compression**: HTTP responses exceeding 1KB are compressed dynamically using Gin response middleware.
- **Strict Pagination Caps**: List endpoints enforce hard limits on page size (`pageSize <= 100`) to cap serialization memory overhead.
- **Cursor Pagination**: High-cardinality list endpoints (e.g. Activity Feeds, Audit Logs) utilize cursor-based keyset pagination rather than expensive SQL `OFFSET` scans.

---

## 2. Middleware Pipeline Cost Control
- Middleware execution order is optimized to reject unauthorized or rate-limited requests early before executing expensive JWT decoding or database queries.
