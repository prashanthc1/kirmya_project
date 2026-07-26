-- Up Migration: Create Professional Verification System Tables

-- 1. Verification Requests Table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    verification_type VARCHAR(100) NOT NULL, -- 'email', 'employment', 'skill', 'certification'
    title VARCHAR(255) NOT NULL,
    organization_name VARCHAR(255),
    credential_id VARCHAR(255),
    verification_url TEXT,
    work_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_review', 'verified', 'rejected'
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_type ON verification_requests(verification_type);

-- 2. Verification Documents Table
CREATE TABLE IF NOT EXISTS verification_documents (
    id UUID PRIMARY KEY,
    request_id UUID REFERENCES verification_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- 'paystub', 'offer_letter', 'diploma', 'certificate_pdf'
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    is_sensitive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_docs_request ON verification_documents(request_id);

-- 3. Verification Status & Privacy Controls Table
CREATE TABLE IF NOT EXISTS verification_status (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    trust_score INT DEFAULT 20, -- 0 to 100
    badge_level VARCHAR(100) DEFAULT 'Basic', -- 'Unverified', 'Basic', 'Verified Professional', 'Verified Elite'
    email_verified BOOLEAN DEFAULT FALSE,
    employment_verified BOOLEAN DEFAULT FALSE,
    skills_verified BOOLEAN DEFAULT FALSE,
    certifications_verified BOOLEAN DEFAULT FALSE,
    privacy_setting VARCHAR(50) DEFAULT 'recruiters_only', -- 'public', 'recruiters_only', 'private'
    hide_sensitive_docs BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_status_user ON verification_status(user_id);
