# Kirmya PostgreSQL Backup & Disaster Recovery Runbook

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: OPERATIONAL RUNBOOK ESTABLISHED  

---

## 1. Backup Strategy & Scheduling

### Recommended Backup Cadence
* **Continuous WAL Archiving**: Point-In-Time Recovery (PITR) with Write-Ahead Logging (WAL-G or pgBackRest) streaming to encrypted cloud storage.
* **Daily Full Backups**: Automated `pg_dump` snapshot taken nightly during off-peak hours (02:00 UTC).
* **Retention Policy**:
  * Daily snapshots retained for 30 days.
  * Weekly full backups retained for 12 weeks.
  * Monthly archive snapshots retained for 1 year.

---

## 2. PostgreSQL Backup Procedures

### Physical & Logical Snapshots
```bash
# Logical full dump of Kirmya database with compression
pg_dump -Fc -v -h ${DB_HOST} -U ${DB_USER} -d kirmya -f /backups/kirmya_$(date +%Y%m%d_%H%M%S).dump

# Schema-only snapshot for rapid migration validation
pg_dump --schema-only -h ${DB_HOST} -U ${DB_USER} -d kirmya -f /backups/kirmya_schema_$(date +%Y%m%d).sql
```

---

## 3. Restore & Disaster Recovery Procedure

### Verification & Restore Runbook
1. **Provision Clean PostgreSQL 16 Target**: Ensure database instance is provisioned with UTF-8 encoding and UUID extensions.
2. **Execute Database Restore**:
   ```bash
   # Restore logical dump into fresh target database
   pg_restore -v -h ${TARGET_HOST} -U ${TARGET_USER} -d kirmya --clean --if-exists /backups/kirmya_YYYYMMDD_HHMMSS.dump
   ```
3. **Verify Data Integrity & Row Counts**:
   ```sql
   SELECT count(*) FROM users;
   SELECT count(*) FROM user_profiles;
   SELECT count(*) FROM jobs;
   SELECT count(*) FROM job_applications;
   ```
4. **Run Application Migration Check**:
   ```bash
   # Binary startup verifies migration version table and applies pending migrations
   ./kirmya
   ```
