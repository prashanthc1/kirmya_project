-- Up Migration: Create Recruiter AI Workspace Subsystem Tables

-- 1. Recruiter AI Sessions Table
CREATE TABLE IF NOT EXISTS recruiter_ai_sessions (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL,
    recruiter_id UUID NOT NULL,
    job_id UUID,
    session_type VARCHAR(100) NOT NULL, -- 'candidate_ranking', 'jd_optimization', 'interview_prep', 'outreach_draft'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recruiter_ai_sessions_org ON recruiter_ai_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_ai_sessions_job ON recruiter_ai_sessions(job_id);

-- 2. AI Candidate Ranking & Resume Scores Table
CREATE TABLE IF NOT EXISTS ai_candidate_scores (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES recruiter_ai_sessions(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    job_id UUID NOT NULL,
    rank_position INT NOT NULL,
    fit_score INT NOT NULL, -- 0 to 100
    strengths JSONB DEFAULT '[]'::jsonb,
    red_flags JSONB DEFAULT '[]'::jsonb,
    match_rationale TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_candidate_scores_session ON ai_candidate_scores(session_id, rank_position ASC);

-- 3. AI Generated Recruiter Content Table
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES recruiter_ai_sessions(id) ON DELETE CASCADE,
    content_type VARCHAR(100) NOT NULL, -- 'interview_questions', 'optimized_jd', 'candidate_outreach_email'
    generated_text TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_generated_content_session ON ai_generated_content(session_id);
