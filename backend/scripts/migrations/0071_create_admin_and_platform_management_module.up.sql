-- Migration 0071 Up: Create Admin Announcements and Audit Performance Indexes

CREATE TABLE IF NOT EXISTS admin_announcements (
    id UUID PRIMARY KEY,
    admin_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    audience VARCHAR(64) NOT NULL DEFAULT 'All Active Users',
    priority VARCHAR(32) NOT NULL DEFAULT 'Normal', -- Low, Normal, High, Urgent
    channels JSONB NOT NULL DEFAULT '["in_app"]', -- ["in_app", "email", "push"]
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    recipient_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_action ON admin_audit_logs(admin_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_flags_env_enabled ON feature_flags(environment, is_enabled);
CREATE INDEX IF NOT EXISTS idx_admin_announcements_created ON admin_announcements(created_at DESC);
