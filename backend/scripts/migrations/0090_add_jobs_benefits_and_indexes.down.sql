-- down migration: revert 0090

DROP INDEX IF EXISTS idx_jobs_salary;
DROP INDEX IF EXISTS idx_jobs_experience_level;
DROP INDEX IF EXISTS idx_jobs_employment_type;
DROP INDEX IF EXISTS idx_jobs_work_mode;
DROP INDEX IF EXISTS idx_jobs_location;
DROP INDEX IF EXISTS idx_jobs_search_active;

ALTER TABLE jobs DROP COLUMN IF EXISTS qualifications;
ALTER TABLE jobs DROP COLUMN IF EXISTS benefits;
