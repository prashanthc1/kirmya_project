-- 0082_create_trust_safety_content_moderation_module.up.sql
-- Kirmya Trust & Safety, Content Moderation, User Reporting, Appeals & Platform Integrity Module

CREATE TABLE IF NOT EXISTS safety_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(32) NOT NULL,
    enforcement_guidance TEXT NOT NULL,
    version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_policies_code ON safety_policies(code);
CREATE INDEX IF NOT EXISTS idx_safety_policies_category ON safety_policies(category);
CREATE INDEX IF NOT EXISTS idx_safety_policies_is_active ON safety_policies(is_active);

CREATE TABLE IF NOT EXISTS user_reputations (
    user_id UUID PRIMARY KEY,
    score FLOAT NOT NULL DEFAULT 100.0,
    confirmed_violations_count INT NOT NULL DEFAULT 0,
    reports_count INT NOT NULL DEFAULT 0,
    reinstatements_count INT NOT NULL DEFAULT 0,
    last_assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_reputations_score ON user_reputations(score);

CREATE TABLE IF NOT EXISTS evidence_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES safety_cases(id) ON DELETE CASCADE,
    report_id UUID REFERENCES safety_reports(id) ON DELETE SET NULL,
    source VARCHAR(64) NOT NULL,
    evidence_type VARCHAR(64) NOT NULL,
    file_hash VARCHAR(128),
    content_preview TEXT,
    access_restricted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_items_case_id ON evidence_items(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_report_id ON evidence_items(report_id);

CREATE TABLE IF NOT EXISTS moderator_workloads (
    admin_id UUID PRIMARY KEY,
    assigned_cases_count INT NOT NULL DEFAULT 0,
    pending_appeals_count INT NOT NULL DEFAULT 0,
    average_resolution_mins FLOAT NOT NULL DEFAULT 0.0,
    sla_status VARCHAR(32) NOT NULL DEFAULT 'on_track'
);

-- Seed default safety policies
INSERT INTO safety_policies (id, code, title, category, description, severity, enforcement_guidance, version, is_active)
VALUES 
    (gen_random_uuid(), 'POL-SCAM-001', 'Advance Fee & Financial Job Scams', 'fake_job', 'Prohibits requesting wire transfers, processing payments upfront, or purchasing equipment prior to employment.', 'critical', 'Immediate content removal and temporary account suspension.', '1.0.0', true),
    (gen_random_uuid(), 'POL-SPAM-001', 'Bulk Unsolicited Messaging', 'spam', 'Prohibits sending mass automated messages or unsolicited promotional content.', 'medium', 'Messaging restriction for 7 days upon confirmation.', '1.0.0', true),
    (gen_random_uuid(), 'POL-IMPERSONATION-001', 'Recruiter Identity Impersonation', 'impersonation', 'Prohibits pretending to represent a corporate entity or another individual.', 'critical', 'Immediate account suspension and identity verification request.', '1.0.0', true)
ON CONFLICT (code) DO NOTHING;
