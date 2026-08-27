# Kirmya Search Optimization & OpenSearch Fallback

## 1. Dual-Tier Search Architecture
- **Primary Search**: OpenSearch cluster executing multi-match fuzzy matching across title, skills, experience level, and location facets.
- **Resilient Fallback**: PostgreSQL `pg_trgm` and `to_tsvector` GIN indexes handle queries transparently if OpenSearch experiences degradation.
- **Search Result Caching**: Public search query hashes are cached in Redis with a 5-minute TTL, bypassing repetitive queries.
