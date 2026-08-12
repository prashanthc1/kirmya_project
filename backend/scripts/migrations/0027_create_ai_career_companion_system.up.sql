-- Up Migration: Create AI Career Companion Subsystem Tables

-- 1. AI Conversations Table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    mode VARCHAR(100) DEFAULT 'career_chat', -- 'career_chat', 'interview_coaching', 'roadmap_gen'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, created_at DESC);

-- 2. AI Messages Table
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL, -- 'user', 'assistant'
    content TEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id, created_at ASC);

-- 3. Career Plans & Roadmaps Table
CREATE TABLE IF NOT EXISTS career_plans (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    target_role VARCHAR(255) NOT NULL,
    target_salary VARCHAR(100),
    current_level VARCHAR(100),
    milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
    progress_percentage INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_plans_user ON career_plans(user_id);

-- 4. Long-Term AI User Career Context & Memory System Table
CREATE TABLE IF NOT EXISTS ai_user_context (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    career_goals JSONB DEFAULT '[]'::jsonb,
    skill_gaps JSONB DEFAULT '[]'::jsonb,
    preferred_industry VARCHAR(255),
    memory_summary TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_user_context_user ON ai_user_context(user_id);
