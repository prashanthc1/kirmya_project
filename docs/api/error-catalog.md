# Kirmya Centralized API Error Catalog

## Error Code Reference

| Error Code | HTTP Status | Description | User Message |
| :--- | :--- | :--- | :--- |
| `UNAUTHORIZED` | 401 | Missing or invalid Bearer JWT token | Authentication is required to access this resource |
| `FORBIDDEN` | 403 | Insufficient RBAC privileges or IDOR check failure | You do not have permission to perform this action |
| `NOT_FOUND` | 404 | Target resource does not exist | The requested resource could not be found |
| `VALIDATION_FAILED` | 422 | Request body or field constraint validation failure | Invalid request attributes provided |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit threshold exceeded | Too many requests. Please slow down. |
| `LEGAL_HOLD_ACTIVE` | 409 | Account deletion blocked by active legal hold | Account deletion cannot proceed due to an active legal hold |
| `INTERNAL_ERROR` | 500 | Unhandled server exception | An internal error occurred. Please try again later. |
