# Kirmya Application Security, IDOR Protection & Resume Access

## 1. IDOR / BOLA Prevention
Every application API request enforces strict dual-ownership validation:
- Candidates can access ONLY applications matching `candidate_id = caller_user_id`.
- Recruiters can access ONLY applications for jobs owned by their active organization (`job_id IN org_jobs`).
- Unauthenticated or unauthorized callers receive `HTTP 404 Not Found` or `HTTP 403 Forbidden`.

## 2. Secure Resume Downloads
Resume files associated with job applications are accessed via temporary signed URLs expiring after 15 minutes, preventing permanent public URL exposure.
