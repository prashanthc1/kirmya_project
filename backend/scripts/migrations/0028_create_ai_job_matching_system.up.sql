-- Up Migration: Create AI Job Matching Subsystem Tables

-- 1. AI Job Matches Table
CREATE TABLE IF NOT EXISTS ai_job_matches (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    job_id UUID NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    overall_score INT NOT NULL, -- 0 to 100
    match_tier VARCHAR(50) NOT NULL, -- 'strong_match', 'good_match', 'potential_match'
    explanation TEXT NOT NULL,
    matched_skills JSONB DEFAULT '[]'::jsonb,
    missing_skills JSONB DEFAULT '[]'::jsonb,
    recommended_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_job_match UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_job_matches_user ON ai_job_matches(user_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_job_matches_job ON ai_job_matches(job_id);

-- 2. Multi-Factor Breakdown Scores & ML Feature Vectors Table
CREATE TABLE IF NOT EXISTS matching_scores (
    id UUID PRIMARY KEY,
    match_id UUID REFERENCES ai_job_matches(id) ON DELETE CASCADE,
    skills_score INT NOT NULL,
    experience_score INT NOT NULL,
    goals_score INT NOT NULL,
    location_score INT NOT NULL,
    salary_score INT NOT NULL,
    learning_score INT NOT NULL,
    applications_score INT NOT NULL,
    feature_vector JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_matching_scores_match ON matching_scores(match_id);

-- 3. Candidate Feedback Loops for Machine Learning Model Training Table
CREATE TABLE IF NOT EXISTS matching_feedback (
    id UUID PRIMARY KEY,
    match_id UUID REFERENCES ai_job_matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    feedback_type VARCHAR(50) NOT NULL, -- 'relevant', 'not_relevant', 'applied', 'dismissed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_matching_feedback_user ON matching_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_matching_feedback_match ON matching_feedback(match_id);
