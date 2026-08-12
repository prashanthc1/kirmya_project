-- up migration: create the core jobs table
--
-- Seven migrations (0044, 0046, 0047, 0048, 0049, 0050, 0051) declare
-- `job_id UUID REFERENCES jobs(id)` and internal/applications joins `jobs j`,
-- but no migration ever created the table. Applying the chain to an empty
-- database fails from 0046 onward with `relation "jobs" does not exist`.
--
-- The letter suffix keeps this ahead of 0044, the first migration that needs
-- the table, without renumbering everything that follows it.
--
-- This is the single job posting table for the platform. The recruiter module's
-- older `recruiter_jobs` (0012) is left alone; new work targets this one, which
-- already carries the company_id, title, description, location, salary_range
-- and employment_type columns the applications queries select.

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    -- The user who owns the posting, and the account that created it. Both are
    -- users(id); the recruiter module resolves its own profile from user_id.
    recruiter_id UUID,
    created_by UUID,

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    responsibilities TEXT,
    requirements TEXT,
    department VARCHAR(150),

    location VARCHAR(200),
    work_mode VARCHAR(30),          -- 'onsite', 'hybrid', 'remote'
    employment_type VARCHAR(50),    -- 'Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'
    experience_level VARCHAR(50),   -- 'Entry', 'Mid', 'Senior', 'Lead', 'Executive'

    -- salary_range is the display string; the numeric bounds drive filtering.
    salary_range VARCHAR(120),
    salary_min NUMERIC(14, 2),
    salary_max NUMERIC(14, 2),
    salary_currency CHAR(3),

    skills JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- 'draft', 'active', 'paused', 'closed', 'expired'
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,

    views_count INT NOT NULL DEFAULT 0,
    applications_count INT NOT NULL DEFAULT 0,

    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT jobs_status_check CHECK (status IN ('draft', 'active', 'paused', 'closed', 'expired')),
    CONSTRAINT jobs_salary_order CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min)
);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_company_created ON jobs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status_published ON jobs(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_open ON jobs(company_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_expiring ON jobs(expires_at) WHERE status = 'active';
