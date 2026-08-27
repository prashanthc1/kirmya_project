# Kirmya PostgreSQL Database & Migration Testing

## 1. Migration & Constraint Validation
- **Isolated Schema Execution**: Tests execute within isolated transaction boundaries (`BEGIN ... ROLLBACK`) to prevent cross-test data pollution.
- **Referential Integrity**: Verifies foreign key cascading constraints and check constraint enforcement on status fields.
- **Migration Rollback Tests**: Schema upgrade and downgrade scripts validated on fresh PostgreSQL containers before production deployments.
