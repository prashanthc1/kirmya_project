# Kirmya API Security Standards & Threat Defenses

## 1. Zero-Trust API Protections
- **Strict Server-Side Ownership**: Every resource mutation query scopes authorization explicitly (`WHERE id = $1 AND user_id = $2`).
- **Input Validation**: All incoming JSON payloads bound to strict DTO structs with Gin validator tags (`binding:"required,max=255"`).
- **Normalized Error Contracts**: Stack traces and internal database error messages stripped from public HTTP responses.
