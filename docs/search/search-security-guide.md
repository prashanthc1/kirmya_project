# Kirmya Search Security, Query Sanitization & Rate Limiting Manual

## 1. Search Query Security & Protection Controls
- **Query Injection Prevention**: Parameterized queries and strict AST parsing prevent OpenSearch DSL injection or malicious wildcard DOS.
- **Search Rate Limiting**: Token-bucket throttling prevents automated keyword brute-forcing and scraping attacks.
- **Data Minimization in Indexes**: Private personal contact info and confidential salary data are stripped before documents enter search clusters.
