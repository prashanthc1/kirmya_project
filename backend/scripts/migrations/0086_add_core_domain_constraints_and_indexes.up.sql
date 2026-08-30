-- up migration: add performance indexes and unique constraints for core business domains

-- 1. Job Applications Unique Constraint and Lookup Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_candidate_job ON job_applications(job_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate ON job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_stage ON job_applications(current_stage);

-- 2. Job Search and Recruiter Listing Compound Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_company_status ON jobs(company_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_status_expires ON jobs(status, expires_at);

-- 3. Application Stage History Index
CREATE INDEX IF NOT EXISTS idx_app_stage_history_app_id ON application_stage_history(application_id);
