# Kirmya Production Networking & Traffic Routing

## 1. Forwarded Headers & Reverse Proxy Configuration
Production reverse proxies (Nginx / Cloudflare ALB) enforce client IP preservation while blocking header spoofing:

- `X-Forwarded-For`: Appended by ingress proxy only; backend inspects leftmost trusted IP.
- `X-Forwarded-Proto`: Fixed to `https` at the proxy edge to ensure secure cookie evaluation.
- `Host`: Validated against canonical domain (`kirmya.com` / `api.kirmya.com`).

---

## 2. TLS & HSTS Enforcement
- **TLS Protocol**: Enforces TLS 1.3 (TLS 1.2 minimum). Legacy SSLv3, TLS 1.0, and TLS 1.1 are disabled.
- **HSTS Header**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` injected on all HTTPS responses.
- **HTTP → HTTPS Redirection**: All inbound HTTP (port 80) requests receive an immediate `301 Moved Permanently` redirect to `https://`.
