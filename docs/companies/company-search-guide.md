# Kirmya Company Search Indexing & OpenSearch Discovery Manual

## 1. Company Discovery & Autocomplete Architecture
- **OpenSearch Indexing**: Multi-field matching across company name, industry taxonomy, headquarters location, and verified status.
- **Autocomplete Suggestions**: Sub-10ms edge-ngram suggestions with debounced client interaction.
- **Privacy Filtering**: Internal, private, or suspended organizations are strictly filtered out of search indices.
