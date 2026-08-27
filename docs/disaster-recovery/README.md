# Kirmya Disaster Recovery (DR) & Business Continuity Hub

Welcome to the Disaster Recovery (DR), Business Continuity Planning (BCP), Automated Backups, Regional Failover, and Game-Day Simulation documentation for Kirmya.

## Documentation Index

- [`dr-audit.md`](dr-audit.md): Complete DR audit, criticality tiers, and RTO/RPO targets across services.
- [`business-continuity-plan.md`](business-continuity-plan.md): Business continuity protocols and crisis operational sequences.
- [`backup-strategy.md`](backup-strategy.md): Automated PostgreSQL PITR backup schedules, encryption, and bucket replication.
- [`restore-procedure.md`](restore-procedure.md): Standard operating procedures for full database and storage restore.
- [`failure-matrix.md`](failure-matrix.md): Single points of failure, dependency failure modes, and graceful degradation.
- [`incident-communications.md`](incident-communications.md): Crisis communication templates and status page broadcasting protocols.
- [`dr-test-report.md`](dr-test-report.md): Game Day disaster simulation results, measured RTO/RPO, and postmortem findings.

### Operational Recovery Runbooks
- [`failover-runbook.md`](failover-runbook.md): Controlled regional failover to secondary cloud cluster.
- [`failback-runbook.md`](failback-runbook.md): Post-incident failback switchover to primary cloud cluster.
- [`database-restore-runbook.md`](database-restore-runbook.md): PostgreSQL point-in-time recovery (PITR) execution.
- [`search-recovery-runbook.md`](search-recovery-runbook.md): OpenSearch cluster reindexing with zero-downtime DB fallback.
- [`event-recovery-runbook.md`](event-recovery-runbook.md): NATS JetStream stream recovery and idempotent message replay.
