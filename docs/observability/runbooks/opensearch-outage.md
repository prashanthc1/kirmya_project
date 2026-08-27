# SRE Runbook: OpenSearch Outage & Rebuild

## 1. Outage Triage
1. Check OpenSearch cluster health status (Green/Yellow/Red) and JVM heap memory.
2. Confirm that API search fallback to PostgreSQL `pg_trgm` GIN indexes is active and serving traffic.
3. Review disk watermarks on OpenSearch data nodes.

---

## 2. Recovery Steps
1. Resolve disk or memory constraints on OpenSearch nodes and restart cluster.
2. Re-trigger full or incremental reindexing from PostgreSQL source of truth.
3. Switch search alias back to OpenSearch upon 100% document parity verification.
