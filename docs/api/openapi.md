# Kirmya OpenAPI Specification & Swagger Architecture

## 1. Automated Spec Generation (`swag`)
- **Code-First Specs**: Swagger 2.0 / OpenAPI 3.0 specs are generated directly from Go doc annotations in delivery handlers using `swag init`.
- **UI Endpoint**: Available at `/swagger/index.html` in development and staging environments.
- **Production Controls**: Swagger UI is disabled by default in production unless `ENABLE_SWAGGER=true` is explicitly set in secure environment config.

---

## 2. Security Annotations
- **Bearer Token Auth**: `@Security BearerAuth` defined on protected endpoints.
- **Zero Credentials**: Private secrets, MFA seeds, and password hashes are strictly omitted from schema definitions.
