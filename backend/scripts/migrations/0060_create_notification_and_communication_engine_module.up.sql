-- Migration 0060: Notification, Email, SMS, Push Notification, Communication Preferences, Templates, Delivery, Digest, Reminder & Communication Management Module

-- 1. Notification Schedules Table
CREATE TABLE IF NOT EXISTS notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_resource_type VARCHAR(64),
    target_resource_id VARCHAR(255),
    action_url TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Scheduled', -- Scheduled, Processing, Sent, Cancelled, Expired
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_schedules_user ON notification_schedules(user_id, status, scheduled_at);

-- 2. Email Delivery Log Table
CREATE TABLE IF NOT EXISTS notification_email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID REFERENCES notification_deliveries(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_address VARCHAR(255) NOT NULL,
    email_subject VARCHAR(255) NOT NULL,
    provider VARCHAR(64) NOT NULL DEFAULT 'smtp',
    status VARCHAR(32) NOT NULL DEFAULT 'Queued', -- Queued, Sent, Delivered, Bounced, Complained, Failed
    bounce_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SMS Delivery Log Table
CREATE TABLE IF NOT EXISTS notification_sms_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID REFERENCES notification_deliveries(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Queued', -- Queued, Sent, Delivered, Failed
    provider VARCHAR(64) NOT NULL DEFAULT 'twilio',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Push Notification Delivery Log Table
CREATE TABLE IF NOT EXISTS notification_push_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID REFERENCES notification_deliveries(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    platform VARCHAR(32) NOT NULL DEFAULT 'web',
    status VARCHAR(32) NOT NULL DEFAULT 'Queued', -- Queued, Sent, Delivered, Failed
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Notification Suppression Rules Table
CREATE TABLE IF NOT EXISTS notification_suppression_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_address VARCHAR(255),
    phone_number VARCHAR(64),
    reason VARCHAR(64) NOT NULL, -- Hard Bounce, Spam Complaint, User Unsubscribe, System Blacklist
    suppressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Rate Limit Tracker Table
CREATE TABLE IF NOT EXISTS notification_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    channel VARCHAR(32) NOT NULL,
    sent_count INT NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category, channel)
);

CREATE INDEX IF NOT EXISTS idx_notification_email_user ON notification_email_events(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notification_sms_user ON notification_sms_events(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notification_push_user ON notification_push_events(user_id, status);
