# SRE Runbook: Post-Incident Failback to Primary Region

## 1. Failback Prerequisites
- Primary cloud region confirmed 100% stable for > 60 consecutive minutes.
- Replication catch-up completed with zero replication lag (`pg_stat_replication`).

---

## 2. Controlled Switchover Steps
1. Place platform in temporary 2-minute maintenance mode (`/maintenance`).
2. Sync latest WAL delta from secondary to primary node.
3. Switch DNS records back to primary cluster and disable maintenance mode.
