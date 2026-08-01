-- up migration: create ATS job applications, stage history, interview feedback, offers, and assignments tables

CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    current_stage VARCHAR(50) DEFAULT 'Applied', -- 'Applied', 'Screening', 'Shortlisted', 'Recruiter Review', 'Interview', 'Technical Round', 'Final Interview', 'Offer', 'Hired', 'Rejected'
    recruiter_id UUID,
    rating INT DEFAULT 5,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_stage_history (
    id UUID PRIMARY KEY,
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    from_stage VARCHAR(50),
    to_stage VARCHAR(50) NOT NULL,
    moved_by UUID NOT NULL,
    notes TEXT,
    moved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_feedback (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL,
    overall_rating INT DEFAULT 5,
    technical_score INT DEFAULT 5,
    communication_score INT DEFAULT 5,
    experience_score INT DEFAULT 5,
    culture_fit_score INT DEFAULT 5,
    recommendation VARCHAR(50) DEFAULT 'Hire', -- 'Strong Hire', 'Hire', 'Maybe', 'Reject'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_offers (
    id UUID PRIMARY KEY,
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    recruiter_id UUID NOT NULL,
    position_title VARCHAR(255) NOT NULL,
    salary VARCHAR(100) NOT NULL,
    currency VARCHAR(20) DEFAULT 'USD',
    benefits TEXT,
    joining_date DATE,
    contract_type VARCHAR(50) DEFAULT 'Full-time',
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Approval', 'Sent', 'Accepted', 'Rejected', 'Expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS candidate_assignments (
    id UUID PRIMARY KEY,
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    assigned_to_user UUID NOT NULL,
    assigned_by_user UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'Recruiter',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate ON job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_stage ON job_applications(current_stage);
CREATE INDEX IF NOT EXISTS idx_stage_history_app ON application_stage_history(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_app ON interview_feedback(application_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_app ON job_offers(application_id);
