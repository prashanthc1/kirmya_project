# Kirmya Disaster Recovery, Backup & Business Continuity Plan

## 1. Disaster Recovery & Availability Targets
- **Recovery Objectives**: Recovery Point Objective (RPO) <= 15 minutes; Recovery Time Objective (RTO) <= 1 hour.
- **Automated PostgreSQL Snapshots**: Daily encrypted snapshot backups with continuous Write-Ahead Log (WAL) archiving to secondary geographic regions.
- **Failover Drills**: Quarterly automated restore verification drills confirming database and search cluster integrity.
