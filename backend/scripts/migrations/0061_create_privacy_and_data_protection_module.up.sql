-- Migration 0061: Privacy, Consent Management, Cookie Preferences, Data Protection, User Data Rights & Privacy Administration Module

-- 1. Privacy Preferences Table
CREATE TABLE IF NOT EXISTS privacy_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    profile_visibility VARCHAR(32) NOT NULL DEFAULT 'Public', -- Public, Registered, Connections, Recruiters, Private
    discover_in_search BOOLEAN NOT NULL DEFAULT TRUE,
    recruiter_discoverable BOOLEAN NOT NULL DEFAULT TRUE,
    recruiter_contactable BOOLEAN NOT NULL DEFAULT TRUE,
    show_resume_to_recruiters BOOLEAN NOT NULL DEFAULT TRUE,
    messaging_permission VARCHAR(32) NOT NULL DEFAULT 'Anyone', -- Anyone, Connections, Recruiters, None
    community_visibility VARCHAR(32) NOT NULL DEFAULT 'Public',
    search_personalization BOOLEAN NOT NULL DEFAULT TRUE,
    ai_data_usage BOOLEAN NOT NULL DEFAULT TRUE,
    analytics_consent BOOLEAN NOT NULL DEFAULT TRUE,
    marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Privacy Audit Events Table
CREATE TABLE IF NOT EXISTS privacy_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_audit_user ON privacy_audit_events(user_id, created_at DESC);

-- 3. Data Processing Records (RoPA) Table
CREATE TABLE IF NOT EXISTS data_processing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    data_category VARCHAR(100) NOT NULL,
    subject_category VARCHAR(100) NOT NULL,
    storage_location VARCHAR(255) NOT NULL DEFAULT 'AWS me-central-1 (Dubai)',
    retention_period VARCHAR(100) NOT NULL DEFAULT '365 days',
    third_parties TEXT,
    legal_basis VARCHAR(100) NOT NULL DEFAULT 'Consent / Contractual Necessity',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Data Processing Records (RoPA)
INSERT INTO data_processing_records (activity_name, purpose, data_category, subject_category, third_parties, legal_basis) VALUES
('User Authentication & Account Management', 'Maintain user identity, sessions, and security controls', 'Account Data', 'Registered Users', 'OAuth / Firebase', 'Contractual Necessity'),
('Candidate Profile & Resume Matching', 'Match job seekers with relevant opportunities using AI', 'Profile Data', 'Job Seekers', 'Kirmya AI Engine', 'User Consent'),
('Recruiter Candidate Discovery', 'Allow verified recruiters to search and contact candidates', 'Recruitment Data', 'Candidates', 'Verified Companies', 'User Consent'),
('Platform Analytics & Product Health', 'Aggregate usage metrics to optimize platform user experience', 'Analytics Data', 'Visitors & Users', 'Internal Analytics', 'Legitimate Interest / Consent')
ON CONFLICT DO NOTHING;
