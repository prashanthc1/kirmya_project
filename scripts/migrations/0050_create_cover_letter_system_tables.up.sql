-- up migration: create cover letter management system tables

-- 1. Cover Letters Master Table
CREATE TABLE IF NOT EXISTS cover_letters (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'Untitled Cover Letter',
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    company_name VARCHAR(255) DEFAULT '',
    job_title VARCHAR(255) DEFAULT '',
    recipient_name VARCHAR(255) DEFAULT 'Hiring Manager',
    recipient_title VARCHAR(255) DEFAULT 'Head of Talent Acquisition',
    job_reference_number VARCHAR(100) DEFAULT '',
    location VARCHAR(255) DEFAULT '',
    date VARCHAR(50) DEFAULT '',
    opening_greeting TEXT DEFAULT 'Dear Hiring Team,',
    introduction TEXT DEFAULT '',
    body TEXT DEFAULT '',
    closing TEXT DEFAULT 'Sincerely,',
    signature TEXT DEFAULT '',
    full_content TEXT DEFAULT '',
    template_name VARCHAR(100) NOT NULL DEFAULT 'modern',
    tone VARCHAR(50) NOT NULL DEFAULT 'Professional',
    target_length VARCHAR(50) NOT NULL DEFAULT 'Standard',
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    is_job_specific BOOLEAN NOT NULL DEFAULT FALSE,
    word_count INT DEFAULT 0,
    character_count INT DEFAULT 0,
    job_match_score INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_job_id ON cover_letters(job_id);

-- 2. Cover Letter Sections Table
CREATE TABLE IF NOT EXISTS cover_letter_sections (
    id UUID PRIMARY KEY,
    cover_letter_id UUID NOT NULL REFERENCES cover_letters(id) ON DELETE CASCADE,
    section_type VARCHAR(100) NOT NULL, -- header, greeting, introduction, body, achievements, closing, signature
    content TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cover_letter_sections_letter ON cover_letter_sections(cover_letter_id);

-- 3. Cover Letter Version History Table
CREATE TABLE IF NOT EXISTS cover_letter_versions (
    id UUID PRIMARY KEY,
    cover_letter_id UUID NOT NULL REFERENCES cover_letters(id) ON DELETE CASCADE,
    version_tag VARCHAR(50) NOT NULL,
    content_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    word_count INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'User',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cover_letter_versions_letter ON cover_letter_versions(cover_letter_id);

-- 4. Cover Letter Templates Table
CREATE TABLE IF NOT EXISTS cover_letter_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Modern', 'Minimal', 'Professional', 'Executive', 'Technical', 'Creative', 'Academic', 'ATS-Friendly'
    description TEXT,
    recommended_use TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Cover Letter Shares Table
CREATE TABLE IF NOT EXISTS cover_letter_shares (
    id UUID PRIMARY KEY,
    cover_letter_id UUID REFERENCES cover_letters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    share_token VARCHAR(100) UNIQUE NOT NULL,
    privacy_level VARCHAR(50) DEFAULT 'Public', -- 'Public', 'Recruiters Only', 'Connections Only', 'Private'
    share_url TEXT,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cover_letter_shares_token ON cover_letter_shares(share_token);

-- 6. Cover Letter Job Matches Table
CREATE TABLE IF NOT EXISTS cover_letter_job_matches (
    id UUID PRIMARY KEY,
    cover_letter_id UUID REFERENCES cover_letters(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    match_score INT DEFAULT 0,
    relevant_skills TEXT[] DEFAULT '{}',
    relevant_experience TEXT[] DEFAULT '{}',
    relevant_achievements TEXT[] DEFAULT '{}',
    recommended_talking_points TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Application Usage Table
CREATE TABLE IF NOT EXISTS cover_letter_application_usage (
    id UUID PRIMARY KEY,
    cover_letter_id UUID REFERENCES cover_letters(id) ON DELETE SET NULL,
    application_id UUID NOT NULL,
    user_id UUID NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Analytics Table
CREATE TABLE IF NOT EXISTS cover_letter_analytics (
    cover_letter_id UUID PRIMARY KEY REFERENCES cover_letters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    total_views INT DEFAULT 0,
    recruiter_views INT DEFAULT 0,
    total_downloads INT DEFAULT 0,
    applications_used_count INT DEFAULT 0,
    avg_match_score DOUBLE PRECISION DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Populate default cover letter templates
INSERT INTO cover_letter_templates (id, name, category, description, recommended_use, thumbnail_url)
VALUES
('modern', 'Modern Glass Accent', 'Modern', 'Clean dual-column header accent with sleek typography hierarchy.', 'Tech, Product, Marketing', '/templates/cl_modern.png'),
('minimal', 'Clean Minimalist', 'Minimal', 'Maximum whitespace elegance focusing directly on body content.', 'Designers, Software Engineers, Startups', '/templates/cl_minimal.png'),
('professional', 'Corporate Executive', 'Professional', 'Traditional formal layout ideal for legal, finance, and corporate management.', 'Corporate, Legal, Finance', '/templates/cl_professional.png'),
('executive', 'Executive Director', 'Executive', 'Sophisticated serif styling tailored for VP, C-Suite, and Lead roles.', 'Executive, Management, Director', '/templates/cl_executive.png'),
('technical', 'Technical Specialist', 'Technical', 'Emphasizes technical stack achievements and architectural impact.', 'Software Engineers, DevOps, Data Scientists', '/templates/cl_technical.png'),
('ats', 'ATS Standard', 'ATS-Friendly', 'Single column 100% parseable standard layout guaranteed for ATS scanners.', 'All Industries, Corporate Applications', '/templates/cl_ats.png')
ON CONFLICT (id) DO NOTHING;
