-- Migration 0081: Security Operations, Threat Detection, Fraud Prevention & Abuse Protection Module

-- 1. Security Alerts Table
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'Medium', -- Informational, Low, Medium, High, Critical
    risk_score INT NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    trigger_event VARCHAR(150) NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'New', -- New, Investigating, Mitigated, Resolved, False Positive, Escalated
    assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);

-- 2. Security Rules Table
CREATE TABLE IF NOT EXISTS security_rules (
    rule_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    threshold_count INT NOT NULL DEFAULT 5,
    time_window_seconds INT NOT NULL DEFAULT 300,
    action VARCHAR(50) NOT NULL DEFAULT 'log', -- log, rate_limit, require_mfa, temporary_restrict, block
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by VARCHAR(150) DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default rules
INSERT INTO security_rules (rule_id, name, category, threshold_count, time_window_seconds, action, is_enabled, updated_by) VALUES
('login_failure_threshold', 'Failed Login Limit', 'authentication', 5, 300, 'temporary_restrict', true, 'system'),
('message_rate_limit', 'Messaging Spam Prevention', 'communication', 30, 60, 'rate_limit', true, 'system'),
('connection_rate_limit', 'Rapid Connection Request Guard', 'social', 20, 60, 'rate_limit', true, 'system'),
('registration_rate_limit', 'IP Registration Burst Shield', 'abuse', 10, 3600, 'block', true, 'system'),
('export_rate_limit', 'Data Export Rate Control', 'data_privacy', 3, 86400, 'require_mfa', true, 'system')
ON CONFLICT (rule_id) DO NOTHING;

-- 3. Account Risk Scores Table
CREATE TABLE IF NOT EXISTS account_risk_scores (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0, -- 0-100
    risk_level VARCHAR(32) NOT NULL DEFAULT 'Normal', -- Normal, Low, Medium, High, Critical
    factors JSONB DEFAULT '[]'::jsonb,
    last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_risk_scores_level ON account_risk_scores(risk_level);

-- 4. Bot Detection Signals Table
CREATE TABLE IF NOT EXISTS bot_detection_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    burst_rate INT NOT NULL DEFAULT 0,
    endpoint_pattern VARCHAR(255) NOT NULL,
    bot_confidence_score INT NOT NULL DEFAULT 0, -- 0-100
    is_bot BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_signals_ip ON bot_detection_signals(ip_address);
CREATE INDEX IF NOT EXISTS idx_bot_signals_is_bot ON bot_detection_signals(is_bot);

-- 5. Fraud Alerts Table
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL, -- user, job_posting, application, message
    entity_id VARCHAR(255) NOT NULL,
    fraud_type VARCHAR(100) NOT NULL, -- fake_job, mass_application, spam_messaging, registration_burst
    score INT NOT NULL DEFAULT 0,
    reasons JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'New', -- New, Investigating, Mitigated, Resolved, False Positive
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_entity ON fraud_alerts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status);

-- 6. Enriched Security Event Details Table
CREATE TABLE IF NOT EXISTS security_event_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id VARCHAR(100) NOT NULL,
    actor_id VARCHAR(255) DEFAULT '',
    target_entity VARCHAR(255) DEFAULT '',
    risk_level VARCHAR(32) NOT NULL DEFAULT 'Normal',
    risk_score INT NOT NULL DEFAULT 0,
    safe_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sec_event_details_corr ON security_event_details(correlation_id);
