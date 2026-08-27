# SRE Runbook: Redis Cache Outage & Recovery

## 1. Outage Triage
1. Check Redis memory usage and hit/miss ratio in Grafana.
2. Confirm if API backend is successfully falling back to PostgreSQL without crashing.
3. Review Redis container logs for OOM or maxclients saturation.

---

## 2. Recovery Steps
1. If memory is exhausted, adjust `maxmemory-policy` to `allkeys-lru` or scale cache memory.
2. Restart Redis cluster nodes.
3. Warm up critical application caches (job filters, top skills) via background worker.
