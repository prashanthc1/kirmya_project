# Kirmya Business Continuity Plan

## 1. Data Classification Tiers
1. **Tier 1 (Critical Business Data)**:
   - Components: Auth, Users, Profiles, Jobs, Applications, Connections, Direct Messages, Communities, Security Logs, Trust & Safety, Privacy Records.
   - Strategy: Continuous PostgreSQL WAL archiving + Daily Full Immutable Vault Backups.
   - Objectives: RPO < 15 mins, RTO < 60 mins.

2. **Tier 2 (Important Operational Data)**:
   - Components: Notifications, Job Alerts, Support Desk, Analytics.
   - Strategy: Daily snapshots + event bus replay capabilities.
   - Objectives: RPO < 1 hour, RTO < 4 hours.

3. **Tier 3 (Rebuildable Transient State)**:
   - Components: Redis Cache, OpenSearch Indexes, Temporary Background Queues.
   - Strategy: Automated background rebuild scripts from Tier 1 PostgreSQL source data.
   - Objectives: RTO < 2 hours (Rebuild from primary source).

## 2. Failover & Operational Resilience
- **Database High Availability**: Primary-Standby streaming replication with automatic health probes.
- **Stateless Application Layer**: Horizontally scalable Gin backend containers and Next.js frontend instances.
