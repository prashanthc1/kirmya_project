# Kirmya PostgreSQL Query Optimization & Indexing Strategy

## 1. N+1 Query Prevention Standards
- **Batching & Prefetching**: Related entities (e.g. User Profile + Skills, Job + Organization details) are retrieved using single parameterized `JOIN` queries or `ANY($1)` batch lookups rather than loops of individual `SELECT` queries.
- **Explicit Column Selection**: Select queries explicitly request required columns (e.g. `SELECT id, title, company_id FROM jobs`) instead of `SELECT *` to minimize memory allocation and network payload size.

---

## 2. PostgreSQL Index Catalog

| Table | Target Columns | Index Type | Optimization Target |
| :--- | :--- | :--- | :--- |
| `jobs` | `(status, published_at DESC)` | B-Tree Partial Index | Rapid public job discovery filtering |
| `applications` | `(job_id, status, applied_at)` | Composite B-Tree | Applicant Tracking System (ATS) filtering |
| `users` | `LOWER(email)` | Unique B-Tree | Instant case-insensitive login lookup |
| `connections` | `(requester_id, addressee_id, status)`| Composite B-Tree | Connection graph traversal & mutual search |
| `security_events` | `(user_id, created_at DESC)` | B-Tree | SOC security audit timeline rendering |
