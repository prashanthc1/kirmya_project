-- Up Migration: Create AI-Ready Career Assistant Subsystem Tables

-- 1. Career Sessions Table
CREATE TABLE IF NOT EXISTS career_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    session_type VARCHAR(100) NOT NULL, -- 'career_recommendations', 'resume_critique', 'skill_gap', 'job_guidance', 'interview_prep'
    title VARCHAR(255) NOT NULL,
    active_topic VARCHAR(150),
    user_context_snapshot JSONB, -- User skills, experience level, target role snapshot
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_sessions_user ON career_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_career_sessions_type ON career_sessions(session_type);

-- 2. AI Recommendations Table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES career_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'career_trajectory', 'resume_fix', 'skill_bridge', 'search_strategy', 'interview_hint'
    title VARCHAR(255) NOT NULL,
    content_text TEXT NOT NULL,
    priority_score INT DEFAULT 8, -- 1 to 10
    action_items TEXT[], -- Array of actionable steps
    bookmarked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_recs_session ON ai_recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_recs_user ON ai_recommendations(user_id);

-- 3. AI Usage Logs Table (Telemetry & Token Quota Management)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    session_id UUID REFERENCES career_sessions(id) ON DELETE SET NULL,
    provider_name VARCHAR(50) NOT NULL, -- 'mock', 'gemini', 'openai', 'anthropic'
    model_name VARCHAR(100) NOT NULL, -- 'gemini-1.5-pro', 'gpt-4o', 'mock-ai-v1'
    request_type VARCHAR(100) NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    latency_ms INT DEFAULT 120,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage_logs(provider_name);
