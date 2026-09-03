-- up migration: add missing columns and performance indexes to jobs table

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS qualifications TEXT;

-- Composite & full-text indexes for search performance
CREATE INDEX IF NOT EXISTS idx_jobs_search_active ON jobs(status, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_work_mode ON jobs(work_mode) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_salary ON jobs(salary_min, salary_max) WHERE status = 'active';
