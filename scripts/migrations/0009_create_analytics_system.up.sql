-- up migration: create analytics logging and daily statistics tables

-- 1. Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY,
    user_id UUID,
    event_type VARCHAR(100) NOT NULL,
    event_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

-- 2. Daily Statistics
CREATE TABLE IF NOT EXISTS daily_statistics (
    date DATE PRIMARY KEY,
    total_users INT DEFAULT 0,
    active_users INT DEFAULT 0,
    jobs_posted INT DEFAULT 0,
    applications_count INT DEFAULT 0,
    connections_count INT DEFAULT 0,
    communities_count INT DEFAULT 0,
    messages_count INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
