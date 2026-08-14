-- Migration 0072: Backup, Disaster Recovery & Business Continuity Module
CREATE TABLE IF NOT EXISTS backup_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_schedule_cron VARCHAR(64) NOT NULL DEFAULT '0 2 * * *',
    retention_days_daily INT NOT NULL DEFAULT 7,
    retention_weeks_weekly INT NOT NULL DEFAULT 4,
    retention_months_monthly INT NOT NULL DEFAULT 12,
    encryption_enabled BOOLEAN NOT NULL DEFAULT true,
    storage_provider VARCHAR(64) NOT NULL DEFAULT 's3_object_store',
    target_rpo_minutes INT NOT NULL DEFAULT 15,
    target_rto_minutes INT NOT NULL DEFAULT 60,
    auto_restore_test_enabled BOOLEAN NOT NULL DEFAULT true,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID
);

CREATE TABLE IF NOT EXISTS backup_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(32) NOT NULL CHECK (backup_type IN ('full', 'pitr_wal', 'object_storage', 'export')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'corrupted')),
    size_bytes BIGINT NOT NULL DEFAULT 0,
    checksum VARCHAR(128) NOT NULL DEFAULT '',
    storage_location VARCHAR(255) NOT NULL DEFAULT '',
    app_version VARCHAR(64) NOT NULL DEFAULT '1.0.0',
    migration_version INT NOT NULL DEFAULT 72,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'failed')),
    retention_expires_at TIMESTAMPTZ NOT NULL,
    is_immutable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    error_message TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(status);
CREATE INDEX IF NOT EXISTS idx_backup_records_type ON backup_records(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_records_created ON backup_records(created_at DESC);

CREATE TABLE IF NOT EXISTS backup_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id UUID NOT NULL REFERENCES backup_records(id) ON DELETE CASCADE,
    verified_by UUID,
    status VARCHAR(32) NOT NULL CHECK (status IN ('passed', 'failed')),
    checks_run JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_backup_verifications_backup ON backup_verifications(backup_id);

CREATE TABLE IF NOT EXISTS restore_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id UUID NOT NULL REFERENCES backup_records(id) ON DELETE CASCADE,
    environment VARCHAR(64) NOT NULL DEFAULT 'isolated_sandbox',
    status VARCHAR(32) NOT NULL CHECK (status IN ('pending', 'running', 'passed', 'failed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    duration_ms BIGINT NOT NULL DEFAULT 0,
    verification_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    failure_reason TEXT DEFAULT '',
    tested_by UUID
);

CREATE INDEX IF NOT EXISTS idx_restore_tests_backup ON restore_tests(backup_id);
CREATE INDEX IF NOT EXISTS idx_restore_tests_status ON restore_tests(status);

CREATE TABLE IF NOT EXISTS recovery_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_number VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(32) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    scenario VARCHAR(64) NOT NULL CHECK (scenario IN ('db_corruption', 'accidental_deletion', 'storage_outage', 'redis_outage', 'ransomware_drill', 'hardware_failure')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('detected', 'investigating', 'restoring', 'verifying', 'resolved', 'closed')),
    recovery_point TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rpo_achieved_sec INT NOT NULL DEFAULT 0,
    rto_achieved_sec INT NOT NULL DEFAULT 0,
    root_cause TEXT DEFAULT '',
    resolution_summary TEXT DEFAULT '',
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_recovery_incidents_severity ON recovery_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_recovery_incidents_status ON recovery_incidents(status);

-- Seed initial backup configuration if none exists
INSERT INTO backup_configurations (
    id, backup_schedule_cron, retention_days_daily, retention_weeks_weekly, retention_months_monthly,
    encryption_enabled, storage_provider, target_rpo_minutes, target_rto_minutes, auto_restore_test_enabled, is_enabled
)
SELECT
    '00000000-0000-0000-0000-000000000001', '0 2 * * *', 7, 4, 12,
    true, 's3_object_store', 15, 60, true, true
WHERE NOT EXISTS (SELECT 1 FROM backup_configurations);
