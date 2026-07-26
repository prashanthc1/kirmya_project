-- Up Migration: Create Compliance and Privacy System Tables

-- 1. Consent Records Table
CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    consent_type VARCHAR(100) NOT NULL, -- 'analytics', 'marketing', 'third_party_sharing'
    is_granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consent_records_user ON consent_records(user_id);

-- 2. Data Requests Table (Subject Access Requests & Right to be Forgotten)
CREATE TABLE IF NOT EXISTS data_requests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- 'data_export', 'account_deletion'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed'
    download_url TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_data_requests_user ON data_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_status ON data_requests(status);

-- 3. Compliance Audit Events Table
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_events_user ON audit_events(user_id);
