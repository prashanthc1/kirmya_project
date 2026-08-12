-- up migration: create recruiter system tables

CREATE TABLE IF NOT EXISTS recruiters (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    company_name VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_pipeline (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    candidate_name VARCHAR(255),
    candidate_email VARCHAR(255),
    stage VARCHAR(50) DEFAULT 'Applied', -- 'Applied', 'Screening', 'Shortlisted', 'Interview', 'Technical Round', 'Final Interview', 'Offer', 'Hired', 'Rejected'
    notes TEXT,
    interview_scheduled_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    candidate_name VARCHAR(255),
    type VARCHAR(50) DEFAULT 'Video', -- 'Video', 'Phone', 'In-person'
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT DEFAULT 45,
    meeting_link VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_notes (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL,
    recruiter_id UUID NOT NULL,
    note TEXT NOT NULL,
    score INT DEFAULT 5,
    recommendation VARCHAR(50) DEFAULT 'Hire',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_candidate_pipeline_job ON candidate_pipeline(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job ON interviews(job_id);
