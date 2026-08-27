# Kirmya Frontend Security & XSS Protection

## 1. XSS & HTML Input Sanitization
- All user-generated text content (job descriptions, community posts, messages) is rendered safely using standard React string escaping.
- HTML content is sanitized via DOMPurify before rendering (`dangerouslySetInnerHTML`).

---

## 2. Environment Variables & Secret Hygiene
- Client environment variables are strictly restricted to `NEXT_PUBLIC_*` prefixes.
- Server-side secrets (DB credentials, JWT secrets, Vault keys) are NEVER exposed to browser bundles.
