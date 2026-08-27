# Kirmya Disaster Restore Procedure & Safety Protocols

## 1. Controlled Restore Safeguards
- **Two-Person Approval Requirement**: Destructive production restores require dual-admin authorization (`disaster_recovery.manage`).
- **Maintenance Mode Activation**: Pre-restore checklist automatically triggers platform maintenance mode to prevent incoming write traffic.
- **Isolated Target Environment**: Backups are restored into an isolated recovery environment first, validated via automated smoke tests, before DNS cutover to production.

---

## 2. Emergency Recovery Checklist

```
 1. [Incident Declaration] ──► Activate Maintenance Mode
 2. [Backup Selection]     ──► Verify AES-256 Checksum & Metadata Signature
 3. [Storage Recovery]     ──► Restore S3 / MinIO User Media Assets
 4. [Database PITR]        ──► Apply Full Snapshot + WAL Replay to Target Timestamp
 5. [Search Indexing]      ──► Trigger Background OpenSearch Rebuild from PostgreSQL
 6. [Session Hygiene]      ──► Revoke Compromised Session Tokens
 7. [Validation Tests]     ──► Run Go Automated Smoke Test Suite
 8. [Production Cutover]   ──► Deactivate Maintenance Mode & Resume Traffic
```
