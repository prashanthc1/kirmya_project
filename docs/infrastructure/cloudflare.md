# Kirmya Cloudflare Edge & CDN Policy

## Edge Security & Cache Controls

1. **Proxy Status**: Cloudflare Orange Cloud Proxy enabled for `kirmya.com` and `api.kirmya.com`.
2. **WAF Rules**: OWASP Core Ruleset enabled; blocks SQL injection, cross-site scripting (XSS), and malicious user agent scraping at the edge.
3. **Private Data Cache Rules**:
   - Dynamic API paths (`/api/v1/auth`, `/api/v1/messages`, `/api/v1/compliance`, `/api/v1/admin`) set `Cache-Control: no-store, private` to prevent edge caching of private user data.
   - Static assets (`/_next/static/*`, `/images/*`, `/fonts/*`) cached at edge for 1 year (`max-age=31536000, immutable`).
