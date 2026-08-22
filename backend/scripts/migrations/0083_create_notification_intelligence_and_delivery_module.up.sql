-- Create notification_digests table
CREATE TABLE IF NOT EXISTS notification_digests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    frequency VARCHAR(32) NOT NULL DEFAULT 'daily',
    category VARCHAR(64) NOT NULL,
    item_count INT NOT NULL DEFAULT 0,
    digest_data JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    scheduled_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_digests_user_status ON notification_digests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notification_digests_scheduled ON notification_digests(scheduled_at, status);

-- Create notification_deduplications table
CREATE TABLE IF NOT EXISTS notification_deduplications (
    idempotency_key VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial notification templates if missing
INSERT INTO notification_templates (id, code, category, title_template, content_template, email_subject_template, email_body_template, push_title_template, push_body_template, variables, is_active, created_at, updated_at)
VALUES 
(
    'a1b2c3d4-0001-4000-8000-000000000001',
    'security_new_login',
    'Security',
    'New Login Detected',
    'A new login to your Kirmya account was detected from {{ipAddress}} on {{deviceName}}.',
    'Security Alert: New login to your Kirmya account',
    '<p>Hello {{userName}},</p><p>We detected a new login to your account from <strong>{{deviceName}}</strong> (IP: {{ipAddress}}).</p><p>If this was not you, please secure your account immediately.</p>',
    'Security Alert: New Login',
    'New login detected from {{deviceName}}.',
    ARRAY['userName', 'deviceName', 'ipAddress', 'actionUrl'],
    TRUE,
    NOW(),
    NOW()
),
(
    'a1b2c3d4-0002-4000-8000-000000000002',
    'job_alert_match',
    'Jobs',
    'New Job Alert Match',
    'A new job matching your alert "{{alertName}}" was posted: {{jobTitle}} at {{companyName}}.',
    'Job Alert: {{jobTitle}} at {{companyName}}',
    '<p>Hello {{userName}},</p><p>A new position matching your alert <strong>{{alertName}}</strong> is now available:</p><h3>{{jobTitle}}</h3><p>{{companyName}} - {{location}}</p>',
    'Job Alert Match',
    '{{jobTitle}} at {{companyName}} matches your alert.',
    ARRAY['userName', 'alertName', 'jobTitle', 'companyName', 'location', 'actionUrl'],
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
