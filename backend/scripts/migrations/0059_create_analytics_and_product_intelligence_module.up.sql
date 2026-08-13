-- Migration 0059: Create Analytics, Product Intelligence, User Analytics, Job Analytics, Recruiter Analytics, Company Analytics, Community Analytics, System Metrics, and Admin Reporting Module
-- Tech Stack: Golang, Gin, PostgreSQL

-- 1. Versioned Event Ingestion Log Table
CREATE TABLE IF NOT EXISTS analytics_events_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    event_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    session_id VARCHAR(255),
    source VARCHAR(50) NOT NULL DEFAULT 'web',
    platform VARCHAR(50) NOT NULL DEFAULT 'desktop',
    metadata JSONB DEFAULT '{}'::jsonb,
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Event Failures Log Table
CREATE TABLE IF NOT EXISTS analytics_event_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID,
    event_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Daily User Summary Table
CREATE TABLE IF NOT EXISTS analytics_daily_users (
    date_bucket DATE PRIMARY KEY,
    active_users INT DEFAULT 0,
    new_users INT DEFAULT 0,
    verified_users INT DEFAULT 0,
    profile_views INT DEFAULT 0,
    search_appearances INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Daily Job Summary Table
CREATE TABLE IF NOT EXISTS analytics_daily_jobs (
    date_bucket DATE PRIMARY KEY,
    jobs_created INT DEFAULT 0,
    jobs_viewed INT DEFAULT 0,
    applications_submitted INT DEFAULT 0,
    applications_withdrawn INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Daily Recruiter Summary Table
CREATE TABLE IF NOT EXISTS analytics_daily_recruiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_bucket DATE NOT NULL,
    organization_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    jobs_posted INT DEFAULT 0,
    candidates_viewed INT DEFAULT 0,
    interviews_scheduled INT DEFAULT 0,
    offers_extended INT DEFAULT 0,
    hires_made INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(date_bucket, organization_id)
);

-- 6. Daily Company Summary Table
CREATE TABLE IF NOT EXISTS analytics_daily_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_bucket DATE NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    company_profile_views INT DEFAULT 0,
    total_job_views INT DEFAULT 0,
    total_applications INT DEFAULT 0,
    followers_count INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(date_bucket, company_id)
);

-- 7. Daily Community Summary Table
CREATE TABLE IF NOT EXISTS analytics_daily_communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_bucket DATE NOT NULL,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    active_members INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    reports_count INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(date_bucket, community_id)
);

-- 8. Daily Messaging Summary Table
CREATE TABLE IF NOT EXISTS analytics_daily_messages (
    date_bucket DATE PRIMARY KEY,
    messages_sent INT DEFAULT 0,
    messages_delivered INT DEFAULT 0,
    messages_read INT DEFAULT 0,
    conversations_active INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 9. Daily AI Usage Summary Table
CREATE TABLE IF NOT EXISTS analytics_daily_ai (
    date_bucket DATE PRIMARY KEY,
    total_requests INT DEFAULT 0,
    successful_requests INT DEFAULT 0,
    failed_requests INT DEFAULT 0,
    avg_latency_ms DOUBLE PRECISION DEFAULT 0.0,
    estimated_cost DOUBLE PRECISION DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. Daily Support Summary Table
CREATE TABLE IF NOT EXISTS analytics_daily_support (
    date_bucket DATE PRIMARY KEY,
    tickets_created INT DEFAULT 0,
    tickets_resolved INT DEFAULT 0,
    avg_response_hours DOUBLE PRECISION DEFAULT 0.0,
    sla_met_count INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 11. Daily Safety Summary Table
CREATE TABLE IF NOT EXISTS analytics_daily_safety (
    date_bucket DATE PRIMARY KEY,
    reports_created INT DEFAULT 0,
    reports_resolved INT DEFAULT 0,
    fake_jobs_blocked INT DEFAULT 0,
    suspensions_count INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 12. User Retention Cohort Matrix Table
CREATE TABLE IF NOT EXISTS analytics_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_date DATE NOT NULL,
    cohort_type VARCHAR(50) NOT NULL DEFAULT 'signup', -- signup, verified, job_applied
    period_offset INT NOT NULL, -- 0 (Day 0), 1 (Day 1), 7 (Day 7), 30 (Day 30), etc.
    user_count INT NOT NULL DEFAULT 0,
    retained_count INT NOT NULL DEFAULT 0,
    retention_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(cohort_date, cohort_type, period_offset)
);

-- 13. Funnel Steps Conversion Table
CREATE TABLE IF NOT EXISTS analytics_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_name VARCHAR(100) NOT NULL, -- application_funnel, signup_funnel
    step_number INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    user_count INT NOT NULL DEFAULT 0,
    conversion_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(funnel_name, step_number)
);

-- 14. Asynchronous Analytics Data Exports Table
CREATE TABLE IF NOT EXISTS analytics_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    export_format VARCHAR(20) NOT NULL DEFAULT 'csv', -- csv, json
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    download_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    file_size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Indexes for Efficient Queries
CREATE INDEX IF NOT EXISTS idx_analytics_v2_type ON analytics_events_v2(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_v2_user ON analytics_events_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_v2_org ON analytics_events_v2(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_v2_created ON analytics_events_v2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_recruiter_org ON analytics_daily_recruiters(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_company_id ON analytics_daily_companies(company_id);
