-- Migration 0054: Centralized Notifications, Alerts & Communication Preferences Module

-- 1. Expanded Notifications Core Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL DEFAULT 'System',
    type VARCHAR(64) NOT NULL,
    priority VARCHAR(16) NOT NULL DEFAULT 'Normal', -- Critical, High, Normal, Low
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255),
    target_resource VARCHAR(255),
    target_resource_type VARCHAR(64),
    action_url TEXT,
    icon VARCHAR(64),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    group_id UUID,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration 0007 already created a narrower notifications table, so the CREATE
-- above is a no-op on any database that ran it. Bring that table up to this
-- schema before the indexes below reference the new columns.
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS category VARCHAR(64) NOT NULL DEFAULT 'System',
    ADD COLUMN IF NOT EXISTS priority VARCHAR(16) NOT NULL DEFAULT 'Normal',
    ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS actor_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS target_resource VARCHAR(255),
    ADD COLUMN IF NOT EXISTS target_resource_type VARCHAR(64),
    ADD COLUMN IF NOT EXISTS action_url TEXT,
    ADD COLUMN IF NOT EXISTS icon VARCHAR(64),
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS group_id UUID,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(user_id, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 2. Notification Internal Event Log
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type VARCHAR(64),
    resource_id VARCHAR(255),
    payload JSONB DEFAULT '{}'::jsonb,
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_events_target ON notification_events(target_user_id, created_at DESC);

-- 3. Granular Category & Channel Communication Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(64) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'System',
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    frequency VARCHAR(32) NOT NULL DEFAULT 'Instant', -- Instant, Daily Digest, Weekly Digest, Never
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, notification_type)
);

-- Same story as notifications: 0007 created this table without the category,
-- SMS and frequency columns the module now reads.
ALTER TABLE notification_preferences
    ADD COLUMN IF NOT EXISTS category VARCHAR(64) NOT NULL DEFAULT 'System',
    ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS frequency VARCHAR(32) NOT NULL DEFAULT 'Instant',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS notification_preference_categories (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    frequency VARCHAR(32) NOT NULL DEFAULT 'Instant',
    PRIMARY KEY (user_id, category)
);

-- 4. Quiet Hours Configuration
CREATE TABLE IF NOT EXISTS quiet_hours_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    start_time VARCHAR(8) NOT NULL DEFAULT '22:00',
    end_time VARCHAR(8) NOT NULL DEFAULT '07:00',
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    days VARCHAR(64) NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Delivery Tracking & Queue
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(32) NOT NULL, -- in_app, email, push, sms, webhook
    provider VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'Pending', -- Pending, Queued, Sent, Delivered, Opened, Failed, Expired, Cancelled
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    last_error TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries(status, scheduled_at);

-- 6. Mobile & Web Push Registered Devices
CREATE TABLE IF NOT EXISTS notification_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL UNIQUE,
    platform VARCHAR(32) NOT NULL, -- web, ios, android
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_devices_user ON notification_devices(user_id, is_active);

-- 7. Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    category VARCHAR(64) NOT NULL,
    title_template VARCHAR(255) NOT NULL,
    content_template TEXT NOT NULL,
    email_subject_template VARCHAR(255),
    email_body_template TEXT,
    push_title_template VARCHAR(255),
    push_body_template TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Grouped Notifications
CREATE TABLE IF NOT EXISTS notification_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_key VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    type VARCHAR(64) NOT NULL,
    item_count INT NOT NULL DEFAULT 1,
    latest_title VARCHAR(255) NOT NULL,
    latest_content TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, group_key)
);

-- 9. Digests
CREATE TABLE IF NOT EXISTS notification_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    frequency VARCHAR(32) NOT NULL, -- Daily, Weekly
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Scheduled', -- Scheduled, Generating, Sent, Failed
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_digest_items (
    digest_id UUID NOT NULL REFERENCES notification_digests(id) ON DELETE CASCADE,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    PRIMARY KEY (digest_id, notification_id)
);

-- 10. Failures & Dead Letter Queue
CREATE TABLE IF NOT EXISTS notification_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID REFERENCES notification_deliveries(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(32) NOT NULL,
    error_message TEXT NOT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    is_dead_letter BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Webhooks & Webhook Deliveries
CREATE TABLE IF NOT EXISTS notification_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret VARCHAR(255) NOT NULL,
    event_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES notification_webhooks(id) ON DELETE CASCADE,
    event_id UUID REFERENCES notification_events(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Pending',
    http_status INT,
    attempts INT NOT NULL DEFAULT 0,
    error_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Audit Logs
CREATE TABLE IF NOT EXISTS notification_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
