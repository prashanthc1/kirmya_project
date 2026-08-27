# Kirmya Analytics Event Taxonomy & Schemas

## 1. Canonical Event Schema
```json
{
  "event_id": "uuid-v4",
  "event_type": "job.viewed | application.submitted | connection.accepted",
  "actor_id": "user-uuid",
  "target_id": "resource-uuid",
  "timestamp": "2026-08-27T18:55:00Z",
  "source": "web_desktop | web_mobile",
  "metadata": {
    "job_category": "Software Engineering",
    "referrer": "recommended_feed"
  }
}
```

---

## 2. Ingestion Deduplication
Events validate `event_id` against Redis cache keys with 24-hour expiration before inserting into PostgreSQL partition tables.
