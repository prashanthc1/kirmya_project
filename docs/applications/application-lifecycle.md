# Kirmya Application Lifecycle & Status State Machine

## 1. Application Submission & Eligibility Checks
1. **Authentication & Authorization**: Caller must be an authenticated job seeker.
2. **Job Status Check**: Target job must be in `Published` status. Submissions to `Draft`, `Paused`, `Closed`, or `Archived` jobs are rejected with `HTTP 409 Conflict`.
3. **Duplicate Protection**: Database unique index on `(job_id, candidate_id)` prevents multiple active submissions for the same job.
4. **Atomic Transaction**: Application creation, resume version snapshot, and event emission execute within a single PostgreSQL database transaction.
