-- up migration: create onboarding system tables

-- 1. Onboarding Progress Table
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    current_step INT NOT NULL DEFAULT 1,
    completed_steps JSONB NOT NULL DEFAULT '[]',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);

-- 2. Profile Completion Analytics Table
CREATE TABLE IF NOT EXISTS profile_completion (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    completion_score INT NOT NULL DEFAULT 0,
    resume_score INT NOT NULL DEFAULT 0,
    skill_score INT NOT NULL DEFAULT 0,
    market_demand_score INT NOT NULL DEFAULT 0,
    ai_insights JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profile_completion_user_id ON profile_completion(user_id);

-- 3. Career Preferences Table
CREATE TABLE IF NOT EXISTS career_preferences (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    desired_job_titles JSONB NOT NULL DEFAULT '[]',
    preferred_industries JSONB NOT NULL DEFAULT '[]',
    preferred_countries JSONB NOT NULL DEFAULT '[]',
    preferred_cities JSONB NOT NULL DEFAULT '[]',
    remote_preference VARCHAR(50) DEFAULT 'hybrid',
    employment_types JSONB NOT NULL DEFAULT '["Full-time"]',
    expected_salary VARCHAR(100) DEFAULT '',
    preferred_currency VARCHAR(10) DEFAULT 'USD',
    preferred_company_size VARCHAR(50) DEFAULT '100-500',
    travel_willingness VARCHAR(50) DEFAULT 'occasional',
    visa_sponsorship_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_preferences_user_id ON career_preferences(user_id);

-- 4. Job Alert Preferences Table
CREATE TABLE IF NOT EXISTS job_alert_preferences (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    frequency VARCHAR(50) NOT NULL DEFAULT 'Daily',
    notification_methods JSONB NOT NULL DEFAULT '["Email", "Push", "In-app"]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_alert_pref_user_id ON job_alert_preferences(user_id);
