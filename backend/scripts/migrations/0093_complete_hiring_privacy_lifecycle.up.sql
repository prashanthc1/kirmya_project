-- Complete the durable hiring and privacy lifecycle used by delivery batch 3.

ALTER TABLE candidate_documents
    ADD COLUMN IF NOT EXISTS storage_key TEXT,
    ADD COLUMN IF NOT EXISTS content BYTEA,
    ADD COLUMN IF NOT EXISTS sha256 VARCHAR(64),
    ADD COLUMN IF NOT EXISTS scan_status VARCHAR(32) NOT NULL DEFAULT 'clean',
    ADD COLUMN IF NOT EXISTS original_filename TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_candidate_documents_storage_key
    ON candidate_documents(storage_key) WHERE storage_key IS NOT NULL;

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS screening_questions JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE job_applications
    ADD COLUMN IF NOT EXISTS contact_name TEXT,
    ADD COLUMN IF NOT EXISTS contact_email TEXT,
    ADD COLUMN IF NOT EXISTS contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS resume_title TEXT,
    ADD COLUMN IF NOT EXISTS resume_sha256 VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_candidate_idempotency
    ON job_applications(candidate_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

ALTER TABLE interviews ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_interviews_application ON interviews(application_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_interviews_organizer_slot
    ON interviews(organizer_id, scheduled_start, scheduled_end)
    WHERE status NOT IN ('cancelled');
CREATE UNIQUE INDEX IF NOT EXISTS idx_interviews_candidate_slot
    ON interviews(candidate_id, scheduled_start, scheduled_end)
    WHERE status NOT IN ('cancelled');

ALTER TABLE data_export_jobs
    ADD COLUMN IF NOT EXISTS storage_key TEXT,
    ADD COLUMN IF NOT EXISTS export_payload BYTEA,
    ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS last_error TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

ALTER TABLE data_deletion_requests
    ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS last_error TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_active_export_per_user
    ON data_export_jobs(user_id)
    WHERE status IN ('pending', 'processing');
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_deletion_per_user
    ON data_deletion_requests(user_id)
    WHERE status IN ('grace_period', 'processing');

CREATE UNIQUE INDEX IF NOT EXISTS idx_cookie_consents_visitor_unique ON cookie_consents(visitor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_legal_acceptance_version_unique
    ON legal_document_acceptances(user_id, document_version_id);

INSERT INTO legal_document_versions (document_id, version, title, content, change_summary, effective_date, status)
SELECT id, current_version, title, title || ' version ' || current_version,
       'Initial durable version record', effective_date, 'published'
FROM legal_documents
ON CONFLICT (document_id, version) DO NOTHING;
