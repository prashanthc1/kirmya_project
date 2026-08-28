# SRE Operations Guide: Job Search Indexing, Matching & ATS Pipelines

## 1. Indexing Failures & Search Fallback
1. **OpenSearch Outage Recovery**: Automated circuit breaker trips to PostgreSQL full-text search (`tsvector`) transparently to end users.
2. **Re-indexing Pipeline**: Batch outbox reconciliation job resyncs published jobs from PostgreSQL to OpenSearch index.
3. **Application Delivery Backlog**: Queue monitoring triggers worker scaling during application surge events.
