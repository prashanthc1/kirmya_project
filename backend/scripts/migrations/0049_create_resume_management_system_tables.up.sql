-- up migration: create resume management system tables

-- 1. Resume Templates Table
CREATE TABLE IF NOT EXISTS resume_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Modern', 'Minimal', 'Executive', 'Professional', 'Technical', 'ATS-Friendly', 'Creative', 'Academic'
    description TEXT,
    recommended_for TEXT,
    ats_compatibility INT DEFAULT 95,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Resume Shares Table
CREATE TABLE IF NOT EXISTS resume_shares (
    id UUID PRIMARY KEY,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    share_token VARCHAR(100) UNIQUE NOT NULL,
    privacy_level VARCHAR(50) DEFAULT 'Public', -- 'Public', 'Recruiters Only', 'Connections Only', 'Private'
    share_url TEXT,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resume_shares_token ON resume_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_resume_shares_resume ON resume_shares(resume_id);

-- 3. Resume Analytics Table
CREATE TABLE IF NOT EXISTS resume_analytics (
    resume_id UUID PRIMARY KEY REFERENCES resumes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    total_views INT DEFAULT 0,
    recruiter_views INT DEFAULT 0,
    total_downloads INT DEFAULT 0,
    applications_used_count INT DEFAULT 0,
    avg_match_score DOUBLE PRECISION DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resume_analytics_user ON resume_analytics(user_id);

-- 4. Resume Job Matches Table
CREATE TABLE IF NOT EXISTS resume_job_matches (
    id UUID PRIMARY KEY,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    job_match_score INT DEFAULT 0,
    missing_keywords TEXT[] DEFAULT '{}',
    missing_skills TEXT[] DEFAULT '{}',
    recommended_changes JSONB DEFAULT '[]'::jsonb,
    tailored_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resume_job_matches_resume ON resume_job_matches(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_job_matches_job ON resume_job_matches(job_id);

-- 5. Extend resumes master table columns
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS completion_percentage INT DEFAULT 0;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS application_count INT DEFAULT 0;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT 'Inter';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS font_size VARCHAR(20) DEFAULT '10pt';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS line_spacing VARCHAR(20) DEFAULT '1.15';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS page_margins VARCHAR(20) DEFAULT '0.5in';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS paper_size VARCHAR(20) DEFAULT 'Letter';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#0066FF';

-- 6. Populate default templates
INSERT INTO resume_templates (id, name, category, description, recommended_for, ats_compatibility, thumbnail_url)
VALUES
('classic', 'Classic ATS', 'ATS-Friendly', 'Standard single-column layout optimized for high parsing accuracy in corporate ATS scanners.', 'Corporate, Legal, Finance', 98, '/templates/classic.png'),
('modern', 'Modern Professional', 'Modern', 'Clean dual-accent header with distinct section borders.', 'Tech, Product Management, Marketing', 95, '/templates/modern.png'),
('minimal', 'Clean Minimalist', 'Minimal', 'Sleek whitespace balance focusing on achievements and impact metrics.', 'Designers, Developers, Startup Roles', 96, '/templates/minimal.png'),
('executive', 'Executive Leadership', 'Executive', 'Sophisticated serif styling tailored for VP, Director, and C-Suite profiles.', 'Executive, Management, Consultants', 94, '/templates/executive.png'),
('technical', 'Technical Developer', 'Technical', 'Highlights technical stack, repositories, and architecture projects first.', 'Software Engineers, DevOps, Data Scientists', 97, '/templates/technical.png'),
('creative', 'Creative Studio', 'Creative', 'Vibrant header accent designed for portfolio-centric professionals.', 'UI/UX, Content Creators, Art Directors', 90, '/templates/creative.png')
ON CONFLICT (id) DO NOTHING;
