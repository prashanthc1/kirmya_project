# Kirmya Zero-Downtime Full & Incremental Reindexing Manual

## 1. Zero-Downtime Index Migrations
- **Blue-Green Index Aliases**: Reindexing tasks build into newly versioned index indices (`kirmya_jobs_v2`) before atomic alias switching.
- **Incremental Resync Tools**: Administrative tooling under `/api/v1/admin/search/reindex` enables targeted reindexing of specific resource subsets.
- **Drift Detection**: Scheduled reconciler jobs compare PostgreSQL record timestamps against OpenSearch document versions to fix index drift.
