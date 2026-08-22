-- Migration: 0084_create_admin_control_center_and_operations_module.up.sql
-- Create Admin Control Center, Feature Flags, Maintenance, and Background Jobs Module

CREATE TABLE IF NOT EXISTS admin_impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_maintenance_mode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    reason TEXT,
    scheduled_at TIMESTAMPTZ,
    enabled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    queue VARCHAR(100) NOT NULL DEFAULT 'default',
    status VARCHAR(50) NOT NULL DEFAULT 'Queued',
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 5,
    last_error TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_impersonation_admin ON admin_impersonation_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_user ON admin_impersonation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_bg_jobs_status ON background_jobs(status, queue);

-- Seed initial maintenance mode row if empty
INSERT INTO platform_maintenance_mode (is_enabled, reason, updated_at)
SELECT FALSE, 'System operational', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM platform_maintenance_mode);
