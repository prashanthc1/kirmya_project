# Kirmya Operational Runbooks & Disaster Recovery Protocols

## 1. Incident Response Framework

```
[1. Detect & Alert] ──► [2. Triage & Classify] ──► [3. Contain & Isolate]
                                                             │
[6. Post-Mortem & Prevent] ◄── [5. Verify & Validate] ◄── [4. Recover & Restore]
```

### 1.1 Incident Severity Levels
- **SEV-1 (Critical)**: Complete platform outage, database unreachability, data integrity breach. (Response time: $< 15\text{ mins}$).
- **SEV-2 (High)**: Major subsystem degradation (e.g. Messaging/WebSockets down, ATS application submission failure). (Response time: $< 30\text{ mins}$).
- **SEV-3 (Medium)**: Non-critical feature impairment (e.g. AI suggestions degraded, search falling back to trigram). (Response time: $< 2\text{ hours}$).

---

## 2. Deployment & Rollback Runbook

### 2.1 Standard Zero-Downtime Deployment
1. Verify CI pipeline pass on `main` branch.
2. Apply pending PostgreSQL migrations:
   ```bash
   # Run forward migration
   go run ./scripts/migrate.go up
   ```
3. Deploy new backend container replicas. Traffic routes only once `/health/ready` returns `200 OK`.
4. Deploy new frontend container replicas.
5. Terminate old container instances gracefully after in-flight request draining.

### 2.2 Immediate Rollback Protocol
If `/health/ready` fails or error rates spike $> 1\%$ post-deployment:
1. Revert container deployment to previous stable image tag (`kirmya-backend:previous`, `kirmya-frontend:previous`).
2. Verify system health at `/health/status`.
3. Note: Non-destructive migrations remain in place; forward-fix patches are applied if schema adjustments are needed.

---

## 3. Database Disaster Recovery & PITR

### 3.1 Restoring from Daily Snapshot
```bash
# 1. Isolate application by enabling maintenance mode
# 2. Restore PostgreSQL cluster from cloud storage snapshot
pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d kirmya_recovery /backups/kirmya_snapshot.dump
# 3. Validate table counts and schema invariants
# 4. Point application DATABASE_URL to restored cluster and restart
```

### 3.2 Point-In-Time Recovery (PITR)
- **Target RPO**: $< 1\text{ hour}$.
- **Target RTO**: $< 30\text{ minutes}$.

---

## 4. Secret & Credential Rotation Runbook

### 4.1 JWT Signing Secret Rotation
1. Deploy updated backend configuration supporting dual-key verification (Primary = New Secret, Secondary = Old Secret).
2. Issue all new tokens signed with New Secret.
3. After 24-hour token expiration window, remove Old Secret from container environment.

### 4.2 Database Credential Rotation
1. Create secondary PostgreSQL user role with identical permissions.
2. Update `DB_USER` and `DB_PASSWORD` in container secret manager.
3. Perform rolling container restart.
4. Revoke and drop old database user role.
