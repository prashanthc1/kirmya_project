-- Up Migration: Create Unified Search System Tables & GIN Full-Text Indexes

-- 1. User Search History Table
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    query VARCHAR(255) NOT NULL,
    category_filter VARCHAR(50) DEFAULT 'all',
    results_count INT DEFAULT 0,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, searched_at DESC);

-- 2. User Search Preferences & Saved Alerts Table
CREATE TABLE IF NOT EXISTS search_preferences (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    saved_query VARCHAR(255) NOT NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    email_alert_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_saved_search UNIQUE (user_id, saved_query)
);

CREATE INDEX IF NOT EXISTS idx_search_preferences_user ON search_preferences(user_id);
