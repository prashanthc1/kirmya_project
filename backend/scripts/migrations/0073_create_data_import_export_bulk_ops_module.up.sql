-- Migration 0073: Data Import, Export, Migration & Bulk Operations Module
CREATE TABLE IF NOT EXISTS data_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_type VARCHAR(64) NOT NULL CHECK (import_type IN ('jobs', 'users_auth', 'skills', 'categories', 'reference_data')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('pending', 'validating', 'ready', 'processing', 'completed', 'completed_with_errors', 'failed', 'cancelled', 'expired')),
    strategy VARCHAR(32) NOT NULL DEFAULT 'create_or_update' CHECK (strategy IN ('create_only', 'create_or_update', 'update_only', 'skip_duplicates', 'reject_duplicates')),
    original_filename VARCHAR(255) NOT NULL DEFAULT '',
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    mime_type VARCHAR(64) NOT NULL DEFAULT 'text/csv',
    column_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_rows INT NOT NULL DEFAULT 0,
    processed_rows INT NOT NULL DEFAULT 0,
    successful_rows INT NOT NULL DEFAULT 0,
    failed_rows INT NOT NULL DEFAULT 0,
    skipped_rows INT NOT NULL DEFAULT 0,
    error_report_url VARCHAR(255) NOT NULL DEFAULT '',
    requested_by UUID NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_data_imports_status ON data_imports(status);
CREATE INDEX IF NOT EXISTS idx_data_imports_type ON data_imports(import_type);
CREATE INDEX IF NOT EXISTS idx_data_imports_requested ON data_imports(requested_by);
CREATE INDEX IF NOT EXISTS idx_data_imports_created ON data_imports(created_at DESC);

CREATE TABLE IF NOT EXISTS data_import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES data_imports(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    field_name VARCHAR(128) NOT NULL DEFAULT '',
    error_type VARCHAR(64) NOT NULL DEFAULT '',
    error_message TEXT NOT NULL DEFAULT '',
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_data_import_errors_import ON data_import_errors(import_id);

CREATE TABLE IF NOT EXISTS data_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_type VARCHAR(64) NOT NULL CHECK (export_type IN ('user_personal_data', 'admin_users', 'admin_jobs', 'admin_applications', 'admin_communities', 'admin_reports', 'admin_analytics')),
    format VARCHAR(16) NOT NULL CHECK (format IN ('zip', 'csv', 'json')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired')),
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    fields_selected JSONB NOT NULL DEFAULT '[]'::jsonb,
    include_pii BOOLEAN NOT NULL DEFAULT false,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    download_url VARCHAR(255) NOT NULL DEFAULT '',
    manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
    export_version VARCHAR(16) NOT NULL DEFAULT 'v1.0',
    requested_by UUID NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_requested ON data_exports(requested_by);
CREATE INDEX IF NOT EXISTS idx_data_exports_created ON data_exports(created_at DESC);

CREATE TABLE IF NOT EXISTS bulk_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(64) NOT NULL CHECK (operation_type IN ('bulk_status_update', 'bulk_archive', 'bulk_assignment', 'bulk_moderation', 'bulk_notification')),
    target_scope VARCHAR(64) NOT NULL CHECK (target_scope IN ('jobs', 'applications', 'users', 'reports', 'support_tickets')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('pending', 'preview', 'processing', 'completed', 'failed', 'cancelled')),
    total_target_count INT NOT NULL DEFAULT 0,
    processed_count INT NOT NULL DEFAULT 0,
    successful_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    requested_by UUID NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations(status);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_requested ON bulk_operations(requested_by);

CREATE TABLE IF NOT EXISTS data_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    version VARCHAR(16) NOT NULL DEFAULT 'v1.0',
    status VARCHAR(32) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'rolled_back')),
    source_table VARCHAR(64) NOT NULL DEFAULT '',
    target_table VARCHAR(64) NOT NULL DEFAULT '',
    records_migrated INT NOT NULL DEFAULT 0,
    reconciliation_matched BOOLEAN NOT NULL DEFAULT true,
    error_summary TEXT DEFAULT '',
    executed_by UUID NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_data_migrations_code ON data_migrations(migration_code);
