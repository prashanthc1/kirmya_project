# Kirmya Query Optimization & Indexing Strategy

## 1. Indexing Design & Access Optimization
- **B-Tree Composite Indexes**: Indexed on compound foreign keys and sort columns (e.g. `(job_id, created_at DESC)` for application timelines).
- **Partial Indexes**: `CREATE INDEX idx_unread_notifications ON notifications (user_id) WHERE is_read = false;` ensures instant unread count badge retrieval.
- **GIN Trigram Indexing**: `CREATE INDEX idx_jobs_search_gin ON jobs USING gin (title gin_trgm_ops, description gin_trgm_ops);` ensures fast full-text substring search.
