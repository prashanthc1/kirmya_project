-- Migration: 0080_create_data_governance_privacy_compliance_module.up.sql
-- Module: Data Governance, Privacy Operations, Compliance & User Rights

-- 1. Extend data_requests table with governance and SLA columns
ALTER TABLE data_requests
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS assigned_to UUID,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Data Inventory & Classification Catalog
CREATE TABLE IF NOT EXISTS data_inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_domain VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    classification_level VARCHAR(50) NOT NULL DEFAULT 'Confidential', -- 'Public', 'Internal', 'Confidential', 'Restricted/PII'
    pii_type VARCHAR(100) NOT NULL DEFAULT 'None',
    retention_period_days INT NOT NULL DEFAULT 365,
    owner_team VARCHAR(100) NOT NULL DEFAULT 'Engineering',
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_data_inventory_table_column UNIQUE (table_name, column_name)
);

CREATE INDEX IF NOT EXISTS idx_data_inventory_classification ON data_inventory_items(classification_level);
CREATE INDEX IF NOT EXISTS idx_data_inventory_domain ON data_inventory_items(data_domain);

-- 3. Data Subject Request Event Audit Timeline
CREATE TABLE IF NOT EXISTS data_subject_request_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES data_requests(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dsr_events_request ON data_subject_request_events(request_id);

-- 4. Retention Policies
CREATE TABLE IF NOT EXISTS retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_domain VARCHAR(100) UNIQUE,
    retention_days INT NOT NULL DEFAULT 365,
    auto_purge_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE retention_policies
    ADD COLUMN IF NOT EXISTS data_domain VARCHAR(100),
    ADD COLUMN IF NOT EXISTS auto_purge_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;

-- 5. Legal Holds
CREATE TABLE IF NOT EXISTS legal_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    reference_case VARCHAR(100) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    release_reason TEXT
);

ALTER TABLE legal_holds
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS reference_case VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS release_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_legal_holds_user_status ON legal_holds(user_id, status);

-- 6. Privileged Data Access Reviews
CREATE TABLE IF NOT EXISTS data_access_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL,
    target_user_id UUID NOT NULL,
    role_reviewed VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed'
    decision VARCHAR(50) NOT NULL DEFAULT 'approved', -- 'approved', 'revoked', 'flagged'
    comments TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_reviews_reviewer ON data_access_reviews(reviewer_id);

-- 7. Third-Party Data Processors
CREATE TABLE IF NOT EXISTS third_party_processors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name VARCHAR(150) NOT NULL,
    purpose TEXT NOT NULL,
    data_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    dpa_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'signed', 'pending', 'expired'
    sub_processors JSONB NOT NULL DEFAULT '[]'::jsonb,
    cross_border_mechanism VARCHAR(100) NOT NULL DEFAULT 'SCC',
    security_certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_rating VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
    last_audit_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Cross-Border Transfer Controls
CREATE TABLE IF NOT EXISTS cross_border_transfer_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_name VARCHAR(100) NOT NULL,
    processor_name VARCHAR(150) NOT NULL,
    legal_basis VARCHAR(100) NOT NULL DEFAULT 'Standard Contractual Clauses',
    transfer_impact_assessed BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'approved',
    safeguards TEXT,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Data Quality Checks
CREATE TABLE IF NOT EXISTS data_quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_name VARCHAR(150) NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'completeness', 'accuracy', 'freshness'
    status VARCHAR(20) NOT NULL DEFAULT 'passed', -- 'passed', 'warning', 'failed'
    score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    anomaly_count INT NOT NULL DEFAULT 0,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Privacy Incidents
CREATE TABLE IF NOT EXISTS privacy_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) NOT NULL DEFAULT 'investigating', -- 'investigating', 'contained', 'resolved'
    impacted_user_count INT NOT NULL DEFAULT 0,
    breach_type VARCHAR(100) NOT NULL DEFAULT 'unauthorized_access',
    reported_by UUID NOT NULL,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    summary TEXT
);

-- 11. Privacy Policy Versions
CREATE TABLE IF NOT EXISTS privacy_policy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_string VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    effective_date DATE NOT NULL,
    changes_summary TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
