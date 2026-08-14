-- Migration 0075: Notification Delivery Analytics & Dead-Letter Queue Module
CREATE TABLE IF NOT EXISTS notification_dead_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    channel VARCHAR(32) NOT NULL CHECK (channel IN ('in_app', 'email', 'push', 'sms', 'webhook')),
    provider VARCHAR(32) NOT NULL DEFAULT 'internal',
    failure_reason TEXT NOT NULL DEFAULT '',
    attempts_made INT NOT NULL DEFAULT 3,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'dead_lettered' CHECK (status IN ('dead_lettered', 'retried', 'discarded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_dlq_user ON notification_dead_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_dlq_status ON notification_dead_letters(status);
CREATE INDEX IF NOT EXISTS idx_notification_dlq_channel ON notification_dead_letters(channel);

CREATE TABLE IF NOT EXISTS notification_analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    channel VARCHAR(32) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'all',
    total_queued BIGINT NOT NULL DEFAULT 0,
    total_sent BIGINT NOT NULL DEFAULT 0,
    total_delivered BIGINT NOT NULL DEFAULT 0,
    total_failed BIGINT NOT NULL DEFAULT 0,
    total_opened BIGINT NOT NULL DEFAULT 0,
    total_clicked BIGINT NOT NULL DEFAULT 0,
    avg_latency_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metric_date, channel, category)
);

CREATE INDEX IF NOT EXISTS idx_notif_analytics_date ON notification_analytics_daily(metric_date DESC);
