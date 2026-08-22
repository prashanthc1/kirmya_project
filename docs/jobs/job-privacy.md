# Kirmya Job Privacy & Candidate Data Protection

## 1. Candidate Application Isolation
- Application details (resumes, cover letters, candidate contact info) are accessible ONLY to the candidate and authorized recruiters representing the posting organization.
- Unauthenticated users or non-authorized recruiters receive `HTTP 404 Not Found` / `HTTP 403 Forbidden` on candidate endpoints to prevent IDOR enumeration.

---

## 2. Draft & Closed Job Privacy
- `Draft`, `Paused`, and `Archived` jobs are excluded from public search endpoints and OpenSearch indices.
