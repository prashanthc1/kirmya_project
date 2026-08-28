# Kirmya Job Search, Filters & Discovery Engine Manual

## 1. Multi-Vector Search & Fallback Strategies
- **Search Engine**: OpenSearch semantic & keyword queries with automatic fallback to PostgreSQL `tsvector` full-text search.
- **Filter Suite**: Industry, Work Mode (`Remote`, `Hybrid`, `On-site`), Employment Type, Experience Level, and Salary Range.
- **Cursor Pagination**: Keyset pagination ensuring consistent performance across massive job inventories.
