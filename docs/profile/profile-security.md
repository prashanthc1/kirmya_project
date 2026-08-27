# Kirmya Profile Security & Anti-Scraping Defenses

## 1. Input Sanitization & Anti-XSS
- All text input fields (About, Project Descriptions, Headlines) are sanitized using Go `bluemonday.UGCPolicy()` before database persistence.
- Avatar and resume uploads verify byte magic headers to prevent polyglot file execution.

---

## 2. Anti-Scraping Rate Limits
- Public profile retrieval endpoints (`GET /api/v1/profile/:username`) are rate-limited to 60 requests per minute per IP to prevent automated profile harvesting.
