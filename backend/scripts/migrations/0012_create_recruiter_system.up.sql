-- up migration: create recruiter profiles and candidate pipeline tracking tables

-- 1. Recruiter Profiles Table
CREATE TABLE IF NOT EXISTS recruiter_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    company_name VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_user ON recruiter_profiles(user_id);

-- 2. Recruiter Jobs Table
CREATE TABLE IF NOT EXISTS recruiter_jobs (
    id UUID PRIMARY KEY,
    recruiter_id UUID REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    department VARCHAR(100),
    location VARCHAR(150),
    salary_range VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recruiter_jobs_recruiter ON recruiter_jobs(recruiter_id);

-- 3. Candidate Pipeline Table
CREATE TABLE IF NOT EXISTS candidate_pipeline (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES recruiter_jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    stage VARCHAR(50) DEFAULT 'Applied', -- 'Applied', 'Screening', 'Shortlisted', 'Interview', 'Selected', 'Rejected'
    notes TEXT,
    interview_scheduled_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_candidate_pipeline_job ON candidate_pipeline(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_pipeline_stage ON candidate_pipeline(stage);

-- 4. Recruiter Activity Table
CREATE TABLE IF NOT EXISTS recruiter_activity (
    id UUID PRIMARY KEY,
    recruiter_id UUID REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recruiter_activity_recruiter ON recruiter_activity(recruiter_id);
