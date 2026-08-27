# Kirmya Job Platform Guide & Search Architecture

## 1. Multi-Tier Job Discovery
- **OpenSearch Distributed Indexing**: Real-time fuzzy keyword matching on `title`, `description`, `skills`, and `industry`.
- **PostgreSQL Fallback**: `pg_trgm` GIN indexes handle queries transparently during OpenSearch maintenance.
- **Dynamic Faceting & Filtering**: Salary sliders, employment types (Full-Time, Contract, Internship), work modes (Remote, Hybrid, Onsite), and experience levels.
