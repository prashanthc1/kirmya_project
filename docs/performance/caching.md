# Kirmya Redis Caching & Invalidation Architecture

## 1. Safe Caching Candidates
- **Public Job Details**: Key format `kirmya:job:v1:<job_id>` (TTL: 15 minutes).
- **Public Organization Profiles**: Key format `kirmya:org:v1:<org_id>` (TTL: 1 hour).
- **System Feature Flags**: Key format `kirmya:flags:v1` (TTL: 5 minutes).

---

## 2. Stampede Protection & Fallback
- **Single-Flight Coalescing**: Uses `golang.org/x/sync/singleflight` to collapse concurrent cache misses for the same key into a single PostgreSQL database query.
- **Graceful Redis Fallback**: If Redis connectivity drops, queries automatically fall back to PostgreSQL without interrupting user API requests.
- **Cache Isolation**: Private user data (resumes, messages, applications) is NEVER cached globally.
