-- up migration: production application workflow hardening

-- 1. Add missing application snapshot and lifecycle columns to job_applications
ALTER TABLE job_applications 
    ADD COLUMN IF NOT EXISTS resume_id UUID,
    ADD COLUMN IF NOT EXISTS resume_url TEXT,
    ADD COLUMN IF NOT EXISTS cover_letter TEXT,
    ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'Direct',
    ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

-- 2. Create compound performance and idempotency indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_cand_stage ON job_applications(candidate_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_stage ON job_applications(job_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_job_applications_idempotency ON job_applications(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_jobs_cand_job ON saved_jobs(candidate_id, job_id);
