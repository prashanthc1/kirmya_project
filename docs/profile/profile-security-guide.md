# Kirmya Profile Security, IDOR Defense & Anti-Scraping Manual

## 1. Security Safeguards & Threat Defenses
- **IDOR Protection**: Every mutation query evaluates `WHERE user_id = $1` against the validated caller claims.
- **Anti-Scraping & Rate Limiting**: Distributed Redis token-bucket rate limits prevent bulk profile harvesting while preserving accessibility.
- **Input Sanitization**: Rich-text summaries are sanitized against XSS payloads and script injection vectors.
