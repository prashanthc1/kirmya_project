# Kirmya Data Lineage & Flow Mapping

## Lifecycle Data Flow

```
[ User Input ]
      │ (HTTPS POST / TLS 1.3)
      ▼
[ Gin API Handler ] ──► (Input Validation & Sanitize)
      │
      ▼
[ Service Layer ]   ──► (RBAC & Business Rules)
      │
      ├───────────────────────────────┐
      ▼                               ▼
[ PostgreSQL Primary ]      [ NATS Event Bus ]
(Transactional Persistence)           │
                                      ├─────────────────────────┐
                                      ▼                         ▼
                            [ OpenSearch Index ]      [ Redis Cache Buffer ]
                            (Search Query Node)       (Fast Ephemeral Lookups)
```

## Data Lifecycle Transitions
1. **Creation**: Validated at API boundary, written to PostgreSQL transactional primary.
2. **Indexing**: Background NATS workers stream updates to OpenSearch for instant search.
3. **Caching**: Hot user profile and session records cached in Redis with strict TTL.
4. **Purging & Archival**: Retention engine purges expired notifications and anonymizes deleted account profiles.
