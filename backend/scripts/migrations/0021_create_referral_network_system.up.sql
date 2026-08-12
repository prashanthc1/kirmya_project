-- Up Migration: Create Kirmya Referral Network System Tables

-- 1. Referral Requests Table
CREATE TABLE IF NOT EXISTS referral_requests (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    target_job_url TEXT,
    resume_link TEXT,
    message_to_referrer TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'matched', 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referral_requests_candidate ON referral_requests(candidate_id);
CREATE INDEX IF NOT EXISTS idx_referral_requests_company ON referral_requests(company_name);

-- 2. Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY,
    request_id UUID REFERENCES referral_requests(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    referrer_id UUID NOT NULL,
    referrer_name VARCHAR(255) NOT NULL,
    referrer_company VARCHAR(255) NOT NULL,
    referrer_job_title VARCHAR(255) NOT NULL,
    referrer_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_accept', -- 'pending_accept', 'accepted', 'submitted_to_ats', 'interviewing', 'hired', 'rejected'
    privacy_masked BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referrals_candidate ON referrals(candidate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- 3. Referral History & Audit Logs Table
CREATE TABLE IF NOT EXISTS referral_history (
    id UUID PRIMARY KEY,
    referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referral_history_referral ON referral_history(referral_id);
