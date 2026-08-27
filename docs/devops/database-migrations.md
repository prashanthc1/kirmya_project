# Kirmya Database Migration Deployment & Rollback Strategy

## 1. Forward-Compatible Migrations
- All schema changes follow the expand-and-contract pattern (add columns as nullable first; deprecate and drop only after old application versions are retired).
- Migrations run automatically via Go migration runner at startup with advisory locking (`pg_advisory_lock`) to prevent concurrent execution.
