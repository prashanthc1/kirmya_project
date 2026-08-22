# Kirmya Developer Data Governance Guidelines

## Rules for Engineering & Feature Additions

1. **Logging Hygiene**: NEVER log plain email addresses, phone numbers, passwords, MFA secrets, or JWT tokens. Use logger context redaction functions for user identifiers.
2. **Schema Additions**: Every new table column must document its sensitivity level (`Public`, `Internal`, `Private`, `Sensitive`, `Highly Sensitive`) in the PR description.
3. **Data Export Sync**: When introducing user-owned entities, update `GenerateDataExport` in `compliance_service.go` to ensure complete DSAR exports.
4. **Soft Delete Partial Indexing**: When querying soft-deleted tables, always append `WHERE deleted_at IS NULL` or leverage GORM soft-delete scopes.
