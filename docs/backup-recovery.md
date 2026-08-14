# Kirmya Backup Architecture & Recovery Runbook

## 1. Architecture Summary
- **Primary Database**: PostgreSQL 16+ with continuous Write-Ahead Log (WAL) archiving.
- **Backup Types**:
  1. Daily Full Database Snapshots (AES-256-GCM Encrypted).
  2. Incremental WAL Archiving for Point-in-Time Recovery (PITR).
  3. Isolated Object Storage Vault Backup for user attachments and resume documents.
- **Storage Protection**: Offsite object vault with WORM (Write Once, Read Many) immutability.
- **Integrity**: Every backup artifact maintains a deterministic SHA-256 cryptographic checksum stored in `backup_records`.

## 2. Automated Backup Schedule & Retention
- **Daily Backups**: Retained for 7 days.
- **Weekly Backups**: Retained for 4 weeks.
- **Monthly Backups**: Retained for 12 months.

## 3. Cryptographic Verification & Verification API
- Every backup automatically undergoes SHA-256 checksum validation and storage readability checks.
- Administrative verification endpoint: `POST /api/v1/admin/backups/:id/verify`.
