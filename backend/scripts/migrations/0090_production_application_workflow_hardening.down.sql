-- down migration: revert production application workflow hardening

DROP INDEX IF EXISTS idx_saved_jobs_cand_job;
DROP INDEX IF EXISTS idx_job_applications_idempotency;
DROP INDEX IF EXISTS idx_job_applications_job_stage;
DROP INDEX IF EXISTS idx_job_applications_cand_stage;

ALTER TABLE job_applications
    DROP COLUMN IF EXISTS idempotency_key,
    DROP COLUMN IF EXISTS archived_at,
    DROP COLUMN IF EXISTS withdrawn_at,
    DROP COLUMN IF EXISTS source,
    DROP COLUMN IF EXISTS answers,
    DROP COLUMN IF EXISTS cover_letter,
    DROP COLUMN IF EXISTS resume_url,
    DROP COLUMN IF EXISTS resume_id;
