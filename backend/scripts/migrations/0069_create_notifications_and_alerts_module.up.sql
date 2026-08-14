-- up migration: create notification deduplication and admin broadcast tables

-- 1. Notification Deduplication Log
CREATE TABLE IF NOT EXISTS notification_deduplication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_dedup_key ON notification_deduplication(idempotency_key);

-- 2. Admin Broadcast Campaigns
CREATE TABLE IF NOT EXISTS notification_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'System',
    target_role VARCHAR(64) NOT NULL DEFAULT 'All', -- All, Candidates, Recruiters, Admins
    action_url TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'Completed', -- Draft, Processing, Completed, Cancelled
    recipient_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_broadcasts_created ON notification_broadcasts(created_at DESC);
