# Kirmya Profile Search & OpenSearch Indexing

## 1. Indexed Fields & OpenSearch Mapping
Only non-private profile attributes are indexed in OpenSearch:
- `full_name`, `headline`, `location`, `current_company`, `skills` (tokenized array).
- Private fields (phone, email, resume file content, salary preferences) are strictly excluded from search cluster indices.

---

## 2. Event-Driven Index Synchronization
- When a profile is updated, an asynchronous NATS domain event `profile.updated` triggers a background worker to update the OpenSearch index record idempotently.
