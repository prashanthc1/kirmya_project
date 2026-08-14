-- Down migration: ATS Production Hardening
DROP TABLE IF EXISTS candidate_evaluations;
ALTER TABLE candidate_pipeline DROP COLUMN IF EXISTS org_id;
ALTER TABLE candidate_pipeline DROP COLUMN IF EXISTS application_id;
