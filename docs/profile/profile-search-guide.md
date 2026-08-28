# Kirmya Candidate Search Indexing & OpenSearch Discovery Manual

## 1. Candidate Search Indexing Architecture
- **OpenSearch Mappings**: Indexes headline, industry, verified skills, and career level with PostgreSQL fallback.
- **De-Indexing Triggers**: Switching profile to private automatically evicts the user's document from search indices via NATS events.
- **Fairness & Anti-Bias**: Protected demographic characteristics are excluded from indexing and ranking vectors.
