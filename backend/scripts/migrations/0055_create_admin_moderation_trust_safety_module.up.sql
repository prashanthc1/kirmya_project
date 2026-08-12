-- Migration 0055 Up: Create Admin, Moderation, Trust & Safety Module Tables

CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_permissions (
    id UUID PRIMARY KEY,
    code VARCHAR(128) UNIQUE NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS admin_user_roles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    assigned_by UUID,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY,
    admin_id UUID NOT NULL,
    admin_email VARCHAR(255),
    role_code VARCHAR(64),
    action VARCHAR(128) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    reason TEXT,
    ip_address VARCHAR(64),
    user_agent TEXT,
    request_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_cases (
    id UUID PRIMARY KEY,
    case_number VARCHAR(64) UNIQUE NOT NULL,
    target_type VARCHAR(64) NOT NULL, -- User, Company, Job, Post, Comment, Review, Message
    target_id VARCHAR(255) NOT NULL,
    target_title VARCHAR(255),
    reporter_id UUID,
    category VARCHAR(64) NOT NULL, -- Spam, Scam, Harassment, Hate, Impersonation, Fraud, JobScam
    priority VARCHAR(32) NOT NULL DEFAULT 'Medium', -- Critical, High, Medium, Low
    risk_score DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(32) NOT NULL DEFAULT 'New', -- New, Under Review, Needs Info, Action Required, Resolved, Dismissed, Escalated
    assigned_admin_id UUID,
    ai_summary TEXT,
    ai_recommendation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES moderation_cases(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL,
    action_type VARCHAR(64) NOT NULL, -- Approve, Reject, Hide, Remove, Suspend, Restore, Flag
    reason TEXT NOT NULL,
    evidence TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY,
    reporter_id UUID NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    target_title VARCHAR(255),
    category VARCHAR(64) NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    evidence_urls JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'New',
    priority VARCHAR(32) NOT NULL DEFAULT 'Medium',
    assigned_admin_id UUID,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_assignments (
    id UUID PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES content_reports(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL,
    assigned_by UUID NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_flags (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    flag_type VARCHAR(64) NOT NULL, -- Under Review, High Risk, Potential Scam, Verification Required, Repeated Reports
    reason TEXT NOT NULL,
    created_by UUID NOT NULL,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_signals (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    signal_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'Medium',
    score_delta DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_scores (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    risk_level VARCHAR(32) NOT NULL DEFAULT 'Low', -- Low, Medium, High, Critical
    factors JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS fraud_signals (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    fraud_type VARCHAR(64) NOT NULL, -- FakeJob, RecruitmentScam, Impersonation, CredentialTheft, PhishingLink
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    evidence TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'Detected',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_reviews (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(64) NOT NULL, -- User, Company, Recruiter, Skill
    entity_id VARCHAR(255) NOT NULL,
    verification_type VARCHAR(64) NOT NULL,
    submitted_data JSONB,
    document_urls JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'Pending', -- Pending, Under Review, Approved, Rejected, Needs Info
    reviewer_id UUID,
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    event_type VARCHAR(64) NOT NULL, -- Login, Failed Login, Password Reset, Email Change, Phone Change, Session Revocation, Account Lock
    status VARCHAR(32) NOT NULL DEFAULT 'Success',
    ip_address VARCHAR(64),
    user_agent TEXT,
    location VARCHAR(128),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY,
    setting_key VARCHAR(128) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'General',
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY,
    name VARCHAR(128) UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    environment VARCHAR(32) NOT NULL DEFAULT 'production',
    rollout_percentage INT NOT NULL DEFAULT 100,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    updated_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(64) NOT NULL DEFAULT 'alert',
    priority VARCHAR(32) NOT NULL DEFAULT 'High',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    target_role VARCHAR(64) DEFAULT 'All',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Admin & Moderation Operations
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_cases_status ON moderation_cases(status);
CREATE INDEX IF NOT EXISTS idx_moderation_cases_priority ON moderation_cases(priority);
CREATE INDEX IF NOT EXISTS idx_moderation_cases_target ON moderation_cases(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_priority ON content_reports(priority);

CREATE INDEX IF NOT EXISTS idx_account_flags_user_id ON account_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_entity ON risk_scores(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_verification_reviews_status ON verification_reviews(status);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
