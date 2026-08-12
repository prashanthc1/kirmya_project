-- Up Migration: Create AI-Powered Resume Analysis Foundation Tables

-- 1. Resume Analysis Table
CREATE TABLE IF NOT EXISTS resume_analysis (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    target_job_title VARCHAR(255) NOT NULL,
    target_job_description TEXT,
    resume_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resume_analysis_user ON resume_analysis(user_id);

-- 2. Resume Scores Table
CREATE TABLE IF NOT EXISTS resume_scores (
    id UUID PRIMARY KEY,
    analysis_id UUID REFERENCES resume_analysis(id) ON DELETE CASCADE,
    overall_score INT NOT NULL, -- 0 to 100
    ats_compatibility_score INT NOT NULL, -- 0 to 100
    structure_score INT NOT NULL,
    skills_score INT NOT NULL,
    experience_score INT NOT NULL,
    job_match_score INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resume_scores_analysis ON resume_scores(analysis_id);

-- 3. Improvement History Table
CREATE TABLE IF NOT EXISTS improvement_history (
    id UUID PRIMARY KEY,
    analysis_id UUID REFERENCES resume_analysis(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    missing_skills TEXT[],
    present_keywords TEXT[],
    missing_keywords TEXT[],
    keyword_density_score INT DEFAULT 75,
    structure_feedback TEXT[],
    experience_bullet_fixes TEXT[],
    general_suggestions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_improvement_history_analysis ON improvement_history(analysis_id);
CREATE INDEX IF NOT EXISTS idx_improvement_history_user ON improvement_history(user_id);
