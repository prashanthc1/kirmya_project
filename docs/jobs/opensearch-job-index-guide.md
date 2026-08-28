# Kirmya OpenSearch Job Indexing, Mappings & Rebuild Runbook

## 1. Index Schema & Tokenization
- **Analyzers**: Custom English stemmer, edge-ngram autocomplete analyzer (min_gram 2, max_gram 15), and exact-match keyword fields.
- **Outbox Ingestion**: Background workers consume NATS `job.published`, `job.updated`, and `job.closed` events to synchronize indices in real time.
- **Index Rebuild SRE Command**: Blue-green reindexing triggered via SRE CLI without zero downtime.
