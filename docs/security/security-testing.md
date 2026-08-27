# Kirmya Automated Security Testing & IDOR Matrix

## Automated Security Test Suite
- **Negative Authorization Tests**: Exercises protected routes with invalid roles/claims, asserting `HTTP 403 Forbidden`.
- **IDOR / BOLA Prevention Tests**: User B attempts access to User A's applications, resumes, and messages, asserting `HTTP 404 / 403`.
- **Rate-Limit Enforcement Tests**: Sends 100 fast requests to `/api/v1/auth/login`, asserting `HTTP 429 Too Many Requests`.
- **Secret Scanning Tests**: Continuous regex checks preventing key leaks in source code and git commits.
