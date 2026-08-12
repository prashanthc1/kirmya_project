-- up migration: create job recommendation system tables

-- 1. Candidate Job Preferences Table
CREATE TABLE IF NOT EXISTS user_job_preferences (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    preferred_titles TEXT[] DEFAULT '{}',
    preferred_locations TEXT[] DEFAULT '{}',
    preferred_industries TEXT[] DEFAULT '{}',
    min_salary INT DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'AED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_job_pref_user_id ON user_job_preferences(user_id);

-- 2. Job Recommendations Registry Table
CREATE TABLE IF NOT EXISTS job_recommendations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    job_id UUID NOT NULL,
    match_score INT NOT NULL DEFAULT 0,
    match_reasons JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_recs_user_id ON job_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_job_recs_score ON job_recommendations(user_id, match_score DESC);

-- 3. Recommendations Feedback Logs Table
CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id UUID PRIMARY KEY,
    recommendation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    feedback_type VARCHAR(50) NOT NULL, -- like, dislike, dismiss, hide_similar
    comments TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rec_feedback_rec_id ON recommendation_feedback(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_user_id ON recommendation_feedback(user_id);
