# Kirmya PostgreSQL Full-Text Search Fallback Engine Manual

## 1. Zero-Downtime PostgreSQL Fallback
- **Database Full-Text Indexing**: GIN indexes over generated `tsvector` columns across jobs, user profiles, and organization tables.
- **Trigram Similarity Matching**: `pg_trgm` extension support for fuzzy typo tolerance when OpenSearch is in maintenance mode.
- **Automated Health Probes**: Seamlessly falls back to SQL queries when OpenSearch health checks return failure or timeout.
