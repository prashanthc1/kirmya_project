# Kirmya Zero-Downtime Migration Runbook & Expand/Contract Patterns

## 1. Safe Schema Evolution Guidelines
1. **Expand Phase**: Add new nullable columns or tables without breaking running backend instances.
2. **Dual-Write / Backfill Phase**: Background worker backfills existing records; application reads from new structure.
3. **Contract Phase**: Apply second migration removing deprecated columns after all instances are updated.
