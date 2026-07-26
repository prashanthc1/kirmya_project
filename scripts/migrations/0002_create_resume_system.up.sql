-- up migration: create resume builder system tables

-- 1. Resumes Master Table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'My Resume',
    template_name VARCHAR(100) NOT NULL DEFAULT 'classic',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    ats_score INT NOT NULL DEFAULT 0,
    ai_suggestions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);

-- 2. Resume Sections Detail Table (Uses JSONB for extensible fields)
CREATE TABLE IF NOT EXISTS resume_sections (
    id UUID PRIMARY KEY,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    section_type VARCHAR(100) NOT NULL, -- personal_info, summary, experience, education, skills, certs, projects, achievements, languages
    content JSONB NOT NULL DEFAULT '{}',
    sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_resume_sections_resume_id ON resume_sections(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_sections_order ON resume_sections(resume_id, sort_order);

-- 3. Resume Version Snapshots Table
CREATE TABLE IF NOT EXISTS resume_versions (
    id UUID PRIMARY KEY,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    version_tag VARCHAR(50) NOT NULL,
    content_snapshot JSONB NOT NULL DEFAULT '{}',
    ats_score INT NOT NULL DEFAULT 0,
    ai_suggestions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id ON resume_versions(resume_id);
