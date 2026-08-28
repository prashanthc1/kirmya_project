# Kirmya Job Search Developer Guide & Query Specifications

## 1. Search Query Pipeline & Filter Serialization
- **OpenSearch Query DSL**: Multi-match cross-field queries matching `title^3`, `skills^2`, `company_name^2`, and `description`.
- **PostgreSQL Fallback Protocol**: If OpenSearch connection trips circuit breaker, requests route automatically to PostgreSQL tsvector queries.
