# SRE Runbook: PostgreSQL Point-in-Time Database Restore

## 1. Point-in-Time Recovery (PITR) Execution
1. Retrieve latest encrypted full snapshot from multi-region backup storage bucket.
2. Spin up target PostgreSQL instance and configure `recovery_target_time = 'YYYY-MM-DD HH:MM:SS UTC'`.
3. Apply continuous WAL segments until specified timestamp.
4. Run automated integrity verification script: `go test -v ./internal/shared/database/...`.
