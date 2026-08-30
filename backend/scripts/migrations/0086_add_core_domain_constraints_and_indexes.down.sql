-- down migration: drop performance indexes and unique constraints
DROP INDEX IF EXISTS idx_app_stage_history_app_id;
DROP INDEX IF EXISTS idx_jobs_status_expires;
DROP INDEX IF EXISTS idx_jobs_company_status;
DROP INDEX IF EXISTS idx_job_applications_stage;
DROP INDEX IF EXISTS idx_job_applications_job;
DROP INDEX IF EXISTS idx_job_applications_candidate;
DROP INDEX IF EXISTS idx_job_applications_candidate_job;
