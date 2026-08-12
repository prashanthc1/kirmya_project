-- up migration: create AI assistants tracking database tables

-- 1. AI Requests Log
CREATE TABLE IF NOT EXISTS ai_requests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    feature VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_requests_user ON ai_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_feature ON ai_requests(feature);

-- 2. AI Execution Results Cache
CREATE TABLE IF NOT EXISTS ai_results (
    id UUID PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES ai_requests(id) ON DELETE CASCADE,
    raw_input TEXT NOT NULL,
    raw_output TEXT NOT NULL,
    parsed_response JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. AI User Tuning Preferences
CREATE TABLE IF NOT EXISTS ai_preferences (
    user_id UUID PRIMARY KEY,
    selected_provider VARCHAR(50) DEFAULT 'mock',
    temperature NUMERIC(3,2) DEFAULT 0.70,
    max_tokens INT DEFAULT 1000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
