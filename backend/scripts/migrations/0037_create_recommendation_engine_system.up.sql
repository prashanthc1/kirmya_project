-- Up Migration: Create Recommendation Engine System Tables

-- 1. Recommendation Events Table (Data Collection & Feedback Loop)
CREATE TABLE IF NOT EXISTS recommendation_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'job', 'person', 'community', 'course', 'event', 'candidate', 'talent_pool'
    item_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'view', 'click', 'apply', 'dismiss', 'save'
    context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rec_events_user ON recommendation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_events_item ON recommendation_events(item_type, item_id);

-- 2. Recommendation ML Models Table
CREATE TABLE IF NOT EXISTS recommendation_models (
    id UUID PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    weights JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Preferences & Feature Vector Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    preferred_skills JSONB DEFAULT '[]'::jsonb,
    preferred_locations JSONB DEFAULT '[]'::jsonb,
    disliked_items JSONB DEFAULT '[]'::jsonb,
    feature_vector JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
