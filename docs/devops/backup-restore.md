# Kirmya Automated Backup & Database Restore Procedures

## 1. Automated PostgreSQL Backups
- **Continuous WAL Archiving**: Point-In-Time Recovery (PITR) enabled with 7-day granular rollback.
- **Daily Full Snapshots**: Encrypted AES-256 full database dumps stored across multi-region bucket storage.
- **Monthly Restore Drill**: Scheduled automated restore verification in an isolated staging environment.
