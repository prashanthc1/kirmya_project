# Kirmya Disaster Recovery Runbook

## 1. Overview & Purpose
This document specifies operational procedures for responding to infrastructure emergencies, database corruption events, storage outages, ransomware threats, and application deployment failures on Kirmya.

## 2. Recovery Objectives
- **Target RPO (Recovery Point Objective)**: < 15 minutes for Tier 1 Critical Data (Auth, Users, Profiles, Jobs, Applications, Direct Messages, Security, Trust & Safety, Privacy Records).
- **Target RTO (Recovery Time Objective)**: < 60 minutes for full platform database and API restoration.

## 3. Incident Declaration & Role Responsibilities
1. **Incident Commander**: Coordinates overall response, declares severity level, and manages internal updates.
2. **Database Recovery Owner**: Manages PostgreSQL PITR (Point-in-Time Recovery), WAL archiving restoration, and schema migration compatibility checks.
3. **Infrastructure & Security Owner**: Audits object storage vaults, rotates compromised credentials, and verifies WORM immutability policies.

## 4. Disaster Recovery Checklist
1. **Detection & Impact Assessment**: Confirm issue via Alerting / Prometheus metrics.
2. **Containment**: Pause incoming API writes if data corruption or unauthorized mutation is detected.
3. **Recovery Point Selection**: Identify last clean verified backup snapshot and target timestamp for PITR.
4. **Isolated Restore Verification**: Execute automated sandbox restore drill (`POST /api/v1/admin/backups/restore-tests`) to validate data integrity.
5. **Double-Confirmed Production Restore**: Execute `POST /api/v1/admin/backups/restore-confirm` requiring `RESTORE-PRODUCTION-DATA` confirmation code, explicit data loss acknowledgment, and RBAC authorization (`backup.restore`).
6. **Post-Restore Smoke Testing**: Run automated smoke test suite verifying Authentication, User Profiles, Jobs, Applications, Connections, Messages, and Audit Logs.
7. **Traffic Restoration & Incident Closure**: Resume production routing and publish root cause analysis (RCA).
