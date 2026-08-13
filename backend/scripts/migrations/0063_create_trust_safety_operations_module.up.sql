-- Migration 0063 Up: Create Trust & Safety Operations, Mutes, & Analytics Tables

-- 1. Safety Mutes Table (User, Community, Conversation, Job)
CREATE TABLE IF NOT EXISTS safety_mutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muted_type VARCHAR(50) NOT NULL, -- user, community, conversation, job
    muted_id UUID NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, muted_type, muted_id)
);

CREATE INDEX IF NOT EXISTS idx_safety_mutes_user ON safety_mutes(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_mutes_target ON safety_mutes(muted_type, muted_id);

-- 2. Ensure indexes on safety_reports, safety_user_blocks, safety_appeals, and safety_restrictions
CREATE INDEX IF NOT EXISTS idx_safety_reports_reporter_created ON safety_reports(reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_reports_category ON safety_reports(category);
CREATE INDEX IF NOT EXISTS idx_safety_appeals_status ON safety_appeals(status);
