-- Up Migration: Create Recruiter & Employer Hiring Management Module Subsystem Tables

-- 1. Organization Recruiter Profiles
CREATE TABLE IF NOT EXISTS recruiter_organization_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(150),
    department VARCHAR(100),
    recruiter_role VARCHAR(50) DEFAULT 'Recruiter', -- 'Owner', 'Hiring Manager', 'Recruiter', 'Admin', 'Interviewer', 'Viewer'
    professional_info TEXT,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    verification_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Verified', 'Rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_org_recruiter UNIQUE (user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_recruiter_org_user ON recruiter_organization_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_org_id ON recruiter_organization_profiles(org_id);

-- 2. Recruiter Role Permissions Matrix
CREATE TABLE IF NOT EXISTS recruiter_role_permissions (
    id UUID PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_recruiter_role_perm UNIQUE (role, permission)
);

CREATE INDEX IF NOT EXISTS idx_recruiter_role_perm ON recruiter_role_permissions(role);

-- 3. Custom Application Questions
CREATE TABLE IF NOT EXISTS job_application_questions (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'Text', -- 'Text', 'LongText', 'SingleChoice', 'MultipleChoice', 'YesNo', 'Number', 'Date', 'FileUpload'
    options JSONB DEFAULT '[]'::jsonb,
    is_required BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_questions_job ON job_application_questions(job_id);

-- 4. Candidate Custom Pipeline Stages per Organization
CREATE TABLE IF NOT EXISTS candidate_pipeline_stages (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    stage_name VARCHAR(100) NOT NULL,
    stage_order INT DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    color VARCHAR(30) DEFAULT '#6366F1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_org ON candidate_pipeline_stages(org_id);

-- 5. Recruiter Internal Notes & Comments
CREATE TABLE IF NOT EXISTS recruiter_internal_notes (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    application_id UUID,
    recruiter_id UUID NOT NULL,
    recruiter_name VARCHAR(255),
    note TEXT NOT NULL,
    score INT DEFAULT 5,
    recommendation VARCHAR(50) DEFAULT 'Consider',
    is_pinned BOOLEAN DEFAULT FALSE,
    mentioned_users JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recruiter_notes_candidate ON recruiter_internal_notes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_notes_org ON recruiter_internal_notes(org_id);

-- 6. Organization-Scoped Candidate Tags
CREATE TABLE IF NOT EXISTS candidate_org_tags (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(30) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_org_tag_name UNIQUE (org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_candidate_tags_org ON candidate_org_tags(org_id);

-- 7. Tag Assignments to Candidates
CREATE TABLE IF NOT EXISTS candidate_tag_assignments (
    id UUID PRIMARY KEY,
    tag_id UUID REFERENCES candidate_org_tags(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_candidate_tag_assignment UNIQUE (tag_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_tag_assign_candidate ON candidate_tag_assignments(candidate_id);

-- 8. Reusable Recruiter Message Templates
CREATE TABLE IF NOT EXISTS recruiter_message_templates (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'General', -- 'Received', 'InterviewInvite', 'Reminder', 'InfoRequest', 'Rejection', 'Offer'
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_msg_templates_org ON recruiter_message_templates(org_id);

-- 9. Candidate Access Audit Log (Privacy Auditing)
CREATE TABLE IF NOT EXISTS candidate_access_logs (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL,
    recruiter_name VARCHAR(255),
    candidate_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'Candidate Viewed', 'Resume Viewed', 'Resume Downloaded', 'Candidate Contacted', 'Stage Changed'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_candidate_access_recruiter ON candidate_access_logs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidate_access_candidate ON candidate_access_logs(candidate_id);
