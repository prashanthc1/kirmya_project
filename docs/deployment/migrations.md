# Kirmya Database Migration Deployment Strategy

## 1. Expand/Contract Migration Protocol
To maintain zero downtime during deployments involving database schema modifications, Kirmya enforces an **Expand/Contract** design:

1. **Expand Phase**: Add new nullable columns or tables in migration `.up.sql`. Deploy backend version that handles both old and new schemas.
2. **Backfill Phase**: Asynchronously backfill or migrate legacy data via background job workers.
3. **Contract Phase**: Deprecate old columns in a subsequent release once all active application instances are running the updated code.

---

## 2. Pre-Migration Verification
Before executing migrations against production database clusters:
- Verify migration script order (sequential numbering `0001` through `0086`).
- Test migration execution against a fresh PostgreSQL test instance using `go test ./internal/shared/database/...`.
- Generate pre-migration snapshot in the Disaster Recovery vault.
