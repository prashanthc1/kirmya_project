-- Migration 0058: Create Trust & Safety, Content Moderation, User Reporting, Blocking, Abuse Prevention, Fraud Detection, and Safety Operations Module
-- Tech Stack: Golang, Gin, PostgreSQL

-- 1. Safety User Blocks Table
CREATE TABLE IF NOT EXISTS safety_user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_type VARCHAR(50) NOT NULL DEFAULT 'user', -- user, recruiter, company
    blocked_id UUID NOT NULL,
    reason TEXT,
    scope VARCHAR(50) NOT NULL DEFAULT 'all', -- all, messaging, networking
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_type, blocked_id)
);

-- 2. Enhanced Safety Reports Catalog
CREATE TABLE IF NOT EXISTS safety_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- user, profile, job, company, recruiter, message, community, comment, resume, file, link, ai_content
    target_id UUID NOT NULL,
    target_title VARCHAR(255),
    category VARCHAR(100) NOT NULL, -- spam, scam, fraud, fake_job, fake_recruiter, impersonation, harassment, threat, hate_abuse, privacy_violation, phishing, malicious_content, inappropriate_content, platform_abuse, copyright, other
    description TEXT NOT NULL,
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted, received, under_review, needs_info, action_taken, no_violation, escalated, appealed, resolved, closed
    priority VARCHAR(32) NOT NULL DEFAULT 'normal', -- low, normal, high, urgent, critical
    assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Safety Report Evidence Table
CREATE TABLE IF NOT EXISTS safety_report_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES safety_reports(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL, -- screenshot, message_log, payload, url, file
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Safety Cases Table
CREATE TABLE IF NOT EXISTS safety_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(64) UNIQUE NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    target_title VARCHAR(255),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'normal',
    risk_score DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- new, queued, under_review, escalated, action_pending, resolved, appealed, closed
    assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_team VARCHAR(100) DEFAULT 'General Safety', -- General Safety, Fraud & Scams, Job Safety, Messaging Safety, Community Safety, Security, Leadership
    ai_summary TEXT,
    ai_recommendation TEXT,
    ai_confidence DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Safety Case Events Audit Trail
CREATE TABLE IF NOT EXISTS safety_case_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES safety_cases(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- status_change, assignment, priority_change, escalation, decision_made, note_added
    previous_value TEXT,
    new_value TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Safety Moderation Decisions & Actions
CREATE TABLE IF NOT EXISTS safety_moderation_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES safety_cases(id) ON DELETE SET NULL,
    report_id UUID REFERENCES safety_reports(id) ON DELETE SET NULL,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- warning, content_removal, visibility_reduction, messaging_restriction, job_posting_restriction, application_restriction, community_restriction, temporary_suspension, permanent_suspension, account_lock, account_deactivation
    enforcement_level VARCHAR(50) NOT NULL DEFAULT 'Notice', -- Notice, Warning, Low Restriction, Moderate Restriction, High Restriction, Temporary Suspension, Permanent Suspension
    reason TEXT NOT NULL,
    policy_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    duration_days INT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    ai_assisted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Active Granular User Restrictions
CREATE TABLE IF NOT EXISTS safety_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restriction_scope VARCHAR(100) NOT NULL, -- messaging, job_posting, application, community, profile, recruiter_activity
    reason TEXT NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Safety Appeals Table
CREATE TABLE IF NOT EXISTS safety_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES safety_moderation_decisions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    explanation TEXT NOT NULL,
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted, under_review, needs_info, upheld, reversed, closed
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 9. Safety Moderator Internal Notes (Audit-Protected)
CREATE TABLE IF NOT EXISTS safety_moderator_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES safety_cases(id) ON DELETE CASCADE,
    report_id UUID REFERENCES safety_reports(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. Safety Policy Rules & Versions
CREATE TABLE IF NOT EXISTS safety_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    condition_json JSONB NOT NULL,
    action_recommendation VARCHAR(100) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'medium',
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 11. Safety SLA Rules Catalog
CREATE TABLE IF NOT EXISTS safety_sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) UNIQUE NOT NULL,
    priority VARCHAR(32) NOT NULL,
    first_review_hours INT NOT NULL DEFAULT 24,
    resolution_hours INT NOT NULL DEFAULT 72,
    escalation_hours INT NOT NULL DEFAULT 48,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_safety_blocks_blocker ON safety_user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_safety_blocks_blocked ON safety_user_blocks(blocked_type, blocked_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_target ON safety_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_reporter ON safety_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_status ON safety_reports(status);
CREATE INDEX IF NOT EXISTS idx_safety_cases_status ON safety_cases(status);
CREATE INDEX IF NOT EXISTS idx_safety_cases_priority ON safety_cases(priority);
CREATE INDEX IF NOT EXISTS idx_safety_restrictions_user ON safety_restrictions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_safety_appeals_user ON safety_appeals(user_id);

-- Seed Default SLA Rules
INSERT INTO safety_sla_rules (category, priority, first_review_hours, resolution_hours, escalation_hours) VALUES
('threat', 'critical', 1, 4, 2),
('scam', 'high', 4, 12, 8),
('fake_job', 'high', 4, 12, 8),
('harassment', 'normal', 12, 24, 18),
('spam', 'low', 24, 72, 48)
ON CONFLICT (category) DO NOTHING;
