# Kirmya API Contract & Integration Test Suite

## 1. Status Code & Error Consistency Matrix
- `200 OK`: Successful data query with JSON payload.
- `201 Created`: Successful entity creation with `Location` or resource header.
- `400 Bad Request`: Schema validation failure with structured field errors (`{"code": "VALIDATION_FAILED", "fields": {...}}`).
- `401 Unauthorized`: Missing or expired session token.
- `403 Forbidden`: Insufficient RBAC permissions or IDOR violation.
- `404 Not Found`: Resource non-existent or inaccessible.
- `409 Conflict`: Double-booking or unique constraint violation.
- `429 Too Many Requests`: Rate-limiting threshold breached.
