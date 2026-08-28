# Kirmya Centralized API Error Catalog & Taxonomy

## 1. Machine-Readable Error Code Catalog

The Kirmya REST API utilizes a standardized machine-readable error code taxonomy. Every error response provides a top-level `code`, a user-facing localized `message`, and optional structured `details`.

| Error Code | HTTP Status | Description | Standard Client Remediation |
| :--- | :---: | :--- | :--- |
| `UNAUTHORIZED` | 401 | Missing, malformed, or expired Bearer access token | Redirect user to signin dialog or execute silent refresh token flow |
| `TOKEN_EXPIRED` | 401 | JWT access token expired | Refresh token using `/api/v1/auth/refresh` |
| `FORBIDDEN` | 403 | Insufficient RBAC role or failed resource ownership check | Display access restricted banner or permission upgrade prompt |
| `ACCOUNT_RESTRICTED` | 403 | User account placed under safety moderation restriction | Display restriction notice with appeal submission link |
| `NOT_FOUND` | 404 | Target resource ID or username does not exist | Render 404 Not Found empty state card |
| `VALIDATION_FAILED` | 422 | Input field constraints or type definitions violated | Highlight specific invalid form fields in UI using `details` array |
| `BAD_REQUEST` | 400 | Malformed JSON syntax or unparseable path parameter | Display user input error notification |
| `CONFLICT` | 409 | Unique constraint violated (e.g. email already registered) | Prompt user with login action or conflict resolution options |
| `LEGAL_HOLD_ACTIVE` | 409 | Account deletion blocked due to active legal hold | Inform user of active legal hold policy and support contact |
| `RATE_LIMIT_EXCEEDED` | 429 | Sliding window rate limit threshold exceeded | Display countdown timer using `Retry-After` header |
| `MAINTENANCE_MODE` | 503 | Platform temporarily offline for maintenance | Display scheduled maintenance banner with estimated restore time |
| `INTERNAL_ERROR` | 500 | Unhandled server exception (sanitized) | Display generic retry toast; log trace ID for engineering triage |

---

## 2. Structured Error Response Schema

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The submitted profile information contains validation errors",
    "details": [
      {
        "field": "headline",
        "code": "STRING_MAX_LENGTH",
        "message": "Headline cannot exceed 250 characters"
      },
      {
        "field": "startDate",
        "code": "INVALID_DATE_FORMAT",
        "message": "Start date must be formatted as YYYY-MM-DD"
      }
    ],
    "requestId": "9b1e2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d"
  }
}
```

---

## 3. Security Error Sanitization Guidelines

1. **Zero Database Query Leakage**: SQL syntax errors, table names, and column identifiers must never be returned to the client.
2. **Zero Stack Trace Exposure**: Production Gin mode (`gin.ReleaseMode`) suppresses debug stack traces.
3. **Trace ID Correlation**: The correlation `requestId` or OpenTelemetry `traceId` is included in error logs and response headers for root-cause triage without exposing internal mechanics.
