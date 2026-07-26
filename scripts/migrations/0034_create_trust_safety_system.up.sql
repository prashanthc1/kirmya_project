-- Up Migration: Create Trust and Safety System Tables

-- 1. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY,
    reporter_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'user', 'company', 'job'
    target_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'spam', 'fraud', 'harassment', 'fake_job'
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- 2. Moderation Enforcement Actions Table
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY,
    moderator_id UUID NOT NULL,
    target_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'warn', 'block', 'suspend', 'remove'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_id);

-- 3. Verification Badges Table
CREATE TABLE IF NOT EXISTS verification_badges (
    id UUID PRIMARY KEY,
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'company'
    badge_type VARCHAR(100) NOT NULL, -- 'identity_verified', 'employment_verified', 'company_verified'
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_badges_entity ON verification_badges(entity_type, entity_id);

-- 4. Automated Fraud & Spam Detection Logs Table
CREATE TABLE IF NOT EXISTS fraud_detection_logs (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'job', 'company', 'user'
    entity_id UUID NOT NULL,
    fraud_score NUMERIC(5, 2) NOT NULL, -- 0.00 to 100.00
    triggers JSONB DEFAULT '[]'::jsonb,
    action_taken VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_logs_entity ON fraud_detection_logs(entity_type, entity_id);
