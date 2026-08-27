# Kirmya Single Points of Failure (SPOF) & Failure Matrix

## Component Failure Matrix

| Component Outage | Impact Level | Automated Mitigation | Recovery Procedure |
| :--- | :--- | :--- | :--- |
| **OpenSearch Outage** | Medium | Fallback to PostgreSQL `ILIKE` / `tsvector` queries | Restart OpenSearch pod & trigger background reindex |
| **Redis Cache Outage** | Low | Fallback to direct PostgreSQL queries & in-memory memory cache | Restart Redis container; cache auto-populates |
| **NATS Event Bus Outage**| Medium | Domain events buffered in PostgreSQL outbox table | Restart NATS broker; outbox worker flushes queue |
| **PostgreSQL Outage** | Critical | Failover to Read Replica / PITR Restore | Promote standby replica or trigger WAL recovery |
| **S3 Media Storage Outage**| High | Serve default fallback avatars & cached asset URLs | Failover to secondary offsite object storage bucket |
