# SRE Runbook: OpenSearch Cluster Disaster Recovery & Full Reindex

## 1. Zero-Downtime Index Rebuild
1. Switch API search routing to PostgreSQL `pg_trgm` fallback mode.
2. Initialize fresh OpenSearch index schema: `PUT /kirmya_jobs_v2`.
3. Trigger background reindexing worker: `POST /api/v1/admin/search/reindex`.
4. Switch search alias `kirmya_jobs` to `kirmya_jobs_v2` upon 100% document parity.
