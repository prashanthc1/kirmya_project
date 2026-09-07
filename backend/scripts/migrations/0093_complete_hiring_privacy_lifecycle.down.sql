DROP INDEX IF EXISTS idx_legal_acceptance_version_unique;
DROP INDEX IF EXISTS idx_cookie_consents_visitor_unique;
DROP INDEX IF EXISTS idx_active_deletion_per_user;
DROP INDEX IF EXISTS idx_active_export_per_user;
DROP INDEX IF EXISTS idx_interviews_candidate_slot;
DROP INDEX IF EXISTS idx_interviews_organizer_slot;
DROP INDEX IF EXISTS idx_interviews_application;
DROP INDEX IF EXISTS idx_job_applications_candidate_idempotency;
DROP INDEX IF EXISTS idx_candidate_documents_storage_key;

ALTER TABLE data_deletion_requests DROP COLUMN IF EXISTS cancelled_at, DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS last_error, DROP COLUMN IF EXISTS max_attempts, DROP COLUMN IF EXISTS attempt_count;
ALTER TABLE data_export_jobs DROP COLUMN IF EXISTS cancelled_at, DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS last_error, DROP COLUMN IF EXISTS max_attempts, DROP COLUMN IF EXISTS attempt_count,
    DROP COLUMN IF EXISTS export_payload, DROP COLUMN IF EXISTS storage_key;
ALTER TABLE interviews DROP COLUMN IF EXISTS application_id;
ALTER TABLE job_applications DROP COLUMN IF EXISTS resume_sha256, DROP COLUMN IF EXISTS resume_title,
    DROP COLUMN IF EXISTS contact_phone, DROP COLUMN IF EXISTS contact_email, DROP COLUMN IF EXISTS contact_name;
ALTER TABLE jobs DROP COLUMN IF EXISTS screening_questions;
ALTER TABLE candidate_documents DROP COLUMN IF EXISTS deleted_at, DROP COLUMN IF EXISTS original_filename,
    DROP COLUMN IF EXISTS scan_status, DROP COLUMN IF EXISTS sha256, DROP COLUMN IF EXISTS content,
    DROP COLUMN IF EXISTS storage_key;
