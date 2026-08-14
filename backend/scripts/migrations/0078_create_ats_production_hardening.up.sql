-- ATS Production Hardening Migration

-- 1. Candidate Evaluations (structured job-relevant scoring)
CREATE TABLE IF NOT EXISTS candidate_evaluations (
    id UUID PRIMARY KEY,
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    evaluator_id UUID NOT NULL,
    evaluator_name VARCHAR(255),
    org_id UUID NOT NULL,
    skills_score INT DEFAULT 0 CHECK (skills_score >= 0 AND skills_score <= 10),
    experience_score INT DEFAULT 0 CHECK (experience_score >= 0 AND experience_score <= 10),
    communication_score INT DEFAULT 0 CHECK (communication_score >= 0 AND communication_score <= 10),
    technical_score INT DEFAULT 0 CHECK (technical_score >= 0 AND technical_score <= 10),
    culture_fit_score INT DEFAULT 0 CHECK (culture_fit_score >= 0 AND culture_fit_score <= 10),
    role_fit_score INT DEFAULT 0 CHECK (role_fit_score >= 0 AND role_fit_score <= 10),
    overall_score INT DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 10),
    recommendation VARCHAR(50) DEFAULT 'Consider',
    strengths TEXT,
    weaknesses TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_candidate_eval_app ON candidate_evaluations(application_id);
CREATE INDEX IF NOT EXISTS idx_candidate_eval_candidate ON candidate_evaluations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_eval_org ON candidate_evaluations(org_id);
CREATE INDEX IF NOT EXISTS idx_candidate_eval_evaluator ON candidate_evaluations(evaluator_id);

-- 2. Add org_id to candidate_pipeline if not present
ALTER TABLE candidate_pipeline ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE candidate_pipeline ADD COLUMN IF NOT EXISTS application_id UUID;
CREATE INDEX IF NOT EXISTS idx_candidate_pipeline_org ON candidate_pipeline(org_id);
CREATE INDEX IF NOT EXISTS idx_candidate_pipeline_app ON candidate_pipeline(application_id);

-- 3. Add additional indexes for high-volume ATS queries
CREATE INDEX IF NOT EXISTS idx_job_applications_recruiter ON job_applications(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_updated ON job_applications(updated_at);
CREATE INDEX IF NOT EXISTS idx_recruiter_jobs_status ON recruiter_jobs(status);
CREATE INDEX IF NOT EXISTS idx_recruiter_jobs_org ON recruiter_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled ON interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_stage_history_moved ON application_stage_history(moved_at);
CREATE INDEX IF NOT EXISTS idx_job_offers_status ON job_offers(status);
CREATE INDEX IF NOT EXISTS idx_job_offers_candidate ON job_offers(candidate_id);
