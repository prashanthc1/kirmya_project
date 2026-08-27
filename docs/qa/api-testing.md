# Kirmya API Contract & Integration Testing Standards

## 1. REST Endpoint Validation Guidelines
- **Response Validation**: Every endpoint response payload is checked against OpenAPI 3.0 schemas.
- **Error Response Normalization**: Structured JSON error formats (`code`, `message`, `details`) verified across all 4xx/5xx responses.
- **Golden Route File Updates**: Gin router registrations automatically verified with golden snapshot testing (`internal/router`).
