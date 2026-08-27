# Kirmya API Security & Threat Protection

## 1. Zero Trust Request Validation
- **Authentication**: JWT/Cookie tokens verified on every protected request.
- **Ownership Verification**: Endpoints accepting resource IDs verify caller ownership before mutation or data retrieval.
- **Error Response Normalization**: Production API errors return generic error codes (`RESOURCE_NOT_FOUND`, `FORBIDDEN`, `RATE_LIMITED`) without exposing database stack traces or SQL snippets.
