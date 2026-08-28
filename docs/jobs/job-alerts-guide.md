# Kirmya Job Alerts & Saved Search Notification Engine Manual

## 1. Saved Searches & Alert Delivery Architecture
- **Percolator Queries**: Evaluates newly published job postings against active candidate saved searches in OpenSearch.
- **Deduplication Engine**: Redis idempotency keys ensure candidate receives at most one alert per distinct job posting.
- **Multi-Channel Dispatch**: Routes alerts to In-App notification center, push notifications, and daily/weekly email digests.
