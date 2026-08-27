# Kirmya Disaster Recovery (DR) Plan & Business Continuity

## 1. Recovery Objectives
- **Recovery Point Objective (RPO)**: < 15 minutes (via continuous WAL archiving).
- **Recovery Time Objective (RTO)**: < 60 minutes (via automated container redeployment and database failover).

---

## 2. Failover Protocols
In the event of primary cloud region failure:
1. Promote read replica / restore latest PITR snapshot in secondary region.
2. Update DNS A/CNAME records via Cloudflare API.
3. Deploy API backend instances and verify readiness health checks.
