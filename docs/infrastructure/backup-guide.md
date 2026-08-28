# Kirmya Backup Strategy, Snapshot Lifecycle & Restoration Guide

## 1. Automated Backups & Restoration Verification
- **Automated Snapshots**: Daily point-in-time PostgreSQL snapshots with 30-day retention across secondary cloud regions.
- **WAL Archiving**: Continuous PostgreSQL Write-Ahead Log (WAL) archiving enabling granular point-in-time recovery (PITR).
- **Automated Restore Drills**: Automated monthly restoration pipelines verify snapshot decryptability and data integrity.
