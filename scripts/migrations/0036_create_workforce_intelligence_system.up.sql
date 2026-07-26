-- Up Migration: Create Workforce Intelligence System Tables

-- 1. Market Insights Table
CREATE TABLE IF NOT EXISTS market_insights (
    id UUID PRIMARY KEY,
    industry VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    growth_rate_pct NUMERIC(5, 2) NOT NULL,
    avg_salary_usd NUMERIC(10, 2) NOT NULL,
    active_job_postings INT NOT NULL,
    time_period VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_insights_industry ON market_insights(industry);
CREATE INDEX IF NOT EXISTS idx_market_insights_region ON market_insights(region);

-- 2. Skill Trends & AI Forecasting Table
CREATE TABLE IF NOT EXISTS skill_trends (
    id UUID PRIMARY KEY,
    skill_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    demand_score INT NOT NULL, -- 0 to 100
    growth_yoy_pct NUMERIC(5, 2) NOT NULL,
    avg_salary_premium_pct NUMERIC(5, 2) NOT NULL,
    forecast_tier VARCHAR(50) NOT NULL DEFAULT 'surging', -- 'surging', 'stable', 'declining'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skill_trends_name ON skill_trends(skill_name);

-- 3. Hiring Statistics & Recruiter Competition Table
CREATE TABLE IF NOT EXISTS hiring_statistics (
    id UUID PRIMARY KEY,
    role_title VARCHAR(150) NOT NULL,
    region VARCHAR(50) NOT NULL,
    talent_availability_count INT NOT NULL,
    avg_days_to_hire INT NOT NULL,
    competition_level VARCHAR(50) NOT NULL DEFAULT 'high', -- 'high', 'moderate', 'low'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hiring_stats_role ON hiring_statistics(role_title);
