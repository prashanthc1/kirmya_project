# Kirmya API Rate Limiting & Abuse Prevention Policy

## 1. Rate Limiting Tiers & Thresholds

Kirmya enforces multi-tiered rate limiting using Redis token buckets with in-memory sliding window fallbacks to protect against brute-force attacks, scraping, and denial-of-service attempts.

| Tier / Category | Rate Limit (Window) | Target Routes | Exceeded Behavior |
| :--- | :--- | :--- | :--- |
| **Authentication & Password** | 5 requests / minute | `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/reset-password` | HTTP 429 with 60s cooldown |
| **Search & Discovery** | 60 requests / minute | `/api/v1/search`, `/api/v1/jobs`, `/api/v1/people/search` | HTTP 429 with temporary backoff |
| **Direct Messaging** | 30 messages / minute | `/api/v1/messages/conversations/:id/messages` | HTTP 429 spam block notice |
| **General Authenticated APIs** | 120 requests / minute | `/api/v1/profile`, `/api/v1/applications`, `/api/v1/notifications` | HTTP 429 standard throttle |
| **Public Unauthenticated** | 30 requests / minute | `/api/v1/jobs/:id`, `/api/v1/profile/:username` | HTTP 429 IP throttle |

---

## 2. Standard Rate Limit Headers

Every HTTP response includes standard rate limiting headers:
- `X-RateLimit-Limit`: Maximum allowed requests within the current window.
- `X-RateLimit-Remaining`: Number of remaining requests in the window.
- `X-RateLimit-Reset`: Unix epoch timestamp when the quota resets.
- `Retry-After`: Number of seconds the client must wait before retrying (included on `429 Too Many Requests`).

---

## 3. Trusted Proxy & IP Determination
Rate limiting determines client IP using validated proxy headers (`CF-Connecting-IP`, `X-Real-IP`, `X-Forwarded-For`) only when incoming connections originate from trusted reverse proxies. Spoofed headers from direct connections are ignored.
