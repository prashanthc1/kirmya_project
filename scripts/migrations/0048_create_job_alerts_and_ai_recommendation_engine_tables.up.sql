-- up migration: create job alerts and AI recommendation engine tables

-- 1. Saved Searches Table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    query_text TEXT,
    filters JSONB DEFAULT '{}'::jsonb,
    auto_alert BOOLEAN DEFAULT FALSE,
    alert_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);

-- 2. Recommendation History Table
CREATE TABLE IF NOT EXISTS recommendation_history (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    overall_score INT DEFAULT 0,
    match_reasons JSONB DEFAULT '[]'::jsonb,
    skills_match INT DEFAULT 0,
    experience_match INT DEFAULT 0,
    education_match INT DEFAULT 0,
    salary_match INT DEFAULT 0,
    location_match INT DEFAULT 0,
    industry_match INT DEFAULT 0,
    growth_score INT DEFAULT 0,
    company_fit_score INT DEFAULT 0,
    confidence_score INT DEFAULT 0,
    delivery_channel VARCHAR(50) DEFAULT 'In-App',
    status VARCHAR(50) DEFAULT 'delivered',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rec_history_user ON recommendation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_history_job ON recommendation_history(job_id);

-- 3. Recommendation Feedback Table
CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    recommendation_id UUID,
    action_type VARCHAR(50) NOT NULL, -- 'interested', 'not_interested', 'hide_company', 'hide_role', 'already_applied', 'too_senior', 'too_junior', 'wrong_location', 'wrong_salary'
    feedback_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rec_feedback_user ON recommendation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_job ON recommendation_feedback(job_id);

-- 4. Candidate Career Preferences Table
CREATE TABLE IF NOT EXISTS candidate_career_preferences (
    id UUID PRIMARY KEY,
    candidate_id UUID UNIQUE NOT NULL,
    open_to_work_status VARCHAR(50) DEFAULT 'open', -- 'open', 'casually_looking', 'not_looking'
    target_job_titles TEXT[] DEFAULT '{}',
    preferred_locations TEXT[] DEFAULT '{}',
    remote_preference VARCHAR(50) DEFAULT 'Remote',
    salary_min INT DEFAULT 0,
    salary_max INT DEFAULT 0,
    preferred_company_sizes TEXT[] DEFAULT '{}',
    preferred_industries TEXT[] DEFAULT '{}',
    availability_status VARCHAR(50) DEFAULT 'Immediate',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_candidate_career_prefs_candidate ON candidate_career_preferences(candidate_id);

-- 5. Alert Delivery History Table
CREATE TABLE IF NOT EXISTS alert_delivery_history (
    id UUID PRIMARY KEY,
    alert_id UUID REFERENCES job_alerts(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    delivery_channel VARCHAR(50) NOT NULL, -- 'In-App', 'Email', 'Push', 'SMS', 'Webhook'
    jobs_included INT DEFAULT 0,
    jobs_opened INT DEFAULT 0,
    jobs_clicked INT DEFAULT 0,
    applications_submitted INT DEFAULT 0,
    delivery_status VARCHAR(50) DEFAULT 'Sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_delivery_alert ON alert_delivery_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_delivery_candidate ON alert_delivery_history(candidate_id);

-- 6. Job Search History Table
CREATE TABLE IF NOT EXISTS job_search_history (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    query_text TEXT NOT NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    result_count INT DEFAULT 0,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_search_history_user ON job_search_history(user_id);

-- 7. Job Views Table
CREATE TABLE IF NOT EXISTS job_views (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    view_duration_seconds INT DEFAULT 0,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_views_user ON job_views(user_id);
CREATE INDEX IF NOT EXISTS idx_job_views_job ON job_views(job_id);

-- 8. Extend existing job_alerts table columns if not exists
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS departments TEXT[] DEFAULT '{}';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50) DEFAULT 'Mid-Level';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT '';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT '';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS remote_preference VARCHAR(50) DEFAULT 'Remote';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS company_size VARCHAR(50) DEFAULT 'Any';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS company_type VARCHAR(50) DEFAULT 'Any';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS visa_sponsorship BOOLEAN DEFAULT FALSE;
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS work_authorization VARCHAR(100) DEFAULT '';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS education_level VARCHAR(50) DEFAULT 'Bachelor';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS exclude_keywords TEXT DEFAULT '';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS custom_schedule VARCHAR(50) DEFAULT '';
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS channel_sms BOOLEAN DEFAULT FALSE;
ALTER TABLE job_alerts ADD COLUMN IF NOT EXISTS channel_webhook BOOLEAN DEFAULT FALSE;
