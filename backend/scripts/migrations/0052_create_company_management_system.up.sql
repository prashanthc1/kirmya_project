-- up migration: company and organization management system
--
-- Extends the company tables created in 0011 (companies, company_profiles,
-- company_members, company_followers, company_verification_requests), 0042
-- (company_saved) and 0043 (company_departments, company_locations,
-- company_leaders, company_gallery, company_reports) rather than replacing
-- them, and links company jobs to the jobs table from 0043b so job posting stays in
-- the jobs/recruiter modules.

-- ---------------------------------------------------------------------------
-- 1. Company registry: ownership, tenancy and lifecycle
-- ---------------------------------------------------------------------------
ALTER TABLE companies ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'active'; -- 'active', 'suspended', 'archived'
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_organization ON companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- ---------------------------------------------------------------------------
-- 2. Company profile: branding, narrative sections and derived counters
-- ---------------------------------------------------------------------------
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS company_type VARCHAR(60);   -- 'Private', 'Public', 'Government', 'Non-Profit', 'Startup', 'Agency'
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS headquarters VARCHAR(200);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS brand_assets JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS specialties JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS core_values JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS mission TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS vision TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS history TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS work_culture TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS career_info TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS products JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS services JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS industries JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS technology JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS awards JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS certifications JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS operating_countries JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Counters are maintained by the application from real rows; they start at zero
-- so an unpopulated company reports nothing rather than an invented figure.
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS employees_count INT NOT NULL DEFAULT 0;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS open_jobs_count INT NOT NULL DEFAULT 0;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) NOT NULL DEFAULT 0;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS profile_completion INT NOT NULL DEFAULT 0;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS is_hiring BOOLEAN NOT NULL DEFAULT FALSE;

-- A company is never verified on creation. Only an admin review moves this off
-- 'not_verified', and only 'verified' may render a badge.
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) NOT NULL DEFAULT 'not_verified'; -- 'not_verified', 'pending', 'verified', 'rejected', 'expired'
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE company_profiles DROP CONSTRAINT IF EXISTS company_profiles_verification_status_check;
ALTER TABLE company_profiles ADD CONSTRAINT company_profiles_verification_status_check
    CHECK (verification_status IN ('not_verified', 'pending', 'verified', 'rejected', 'expired'));

CREATE INDEX IF NOT EXISTS idx_company_profiles_industry ON company_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_company_profiles_verification ON company_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_company_profiles_hiring ON company_profiles(is_hiring) WHERE is_hiring = TRUE;

-- ---------------------------------------------------------------------------
-- 3. Departments and locations
-- ---------------------------------------------------------------------------
ALTER TABLE company_departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE company_departments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_company_departments_company ON company_departments(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_company_departments_name ON company_departments(company_id, lower(name));

ALTER TABLE company_locations ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE company_locations ADD COLUMN IF NOT EXISTS postal_code VARCHAR(30);
ALTER TABLE company_locations ADD COLUMN IF NOT EXISTS is_headquarters BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE company_locations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 4. Membership: employees, recruiters and hiring managers on one company
-- ---------------------------------------------------------------------------
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES company_departments(id) ON DELETE SET NULL;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS job_title VARCHAR(200);
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS location VARCHAR(200);
-- 'current_employee', 'former_employee', 'contractor', 'recruiter',
-- 'hiring_manager', 'executive', 'intern'
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS association_type VARCHAR(40) NOT NULL DEFAULT 'current_employee';
-- 'pending', 'approved', 'rejected', 'removed', 'suspended'
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'pending';
-- The member decides whether the association is shown on public pages.
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS started_at DATE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS ended_at DATE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS invited_by UUID;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_status_check;
ALTER TABLE company_members ADD CONSTRAINT company_members_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'removed', 'suspended'));

ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_association_type_check;
ALTER TABLE company_members ADD CONSTRAINT company_members_association_type_check
    CHECK (association_type IN ('current_employee', 'former_employee', 'contractor',
                                'recruiter', 'hiring_manager', 'executive', 'intern'));

CREATE INDEX IF NOT EXISTS idx_company_members_company_status ON company_members(company_id, status);
CREATE INDEX IF NOT EXISTS idx_company_members_department ON company_members(department_id);

-- Rows written before this migration predate the approval workflow; they were
-- created by an administrator adding themselves, so they stay approved.
UPDATE company_members SET status = 'approved' WHERE status = 'pending' AND created_at < CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 5. Role assignments (org-scoped RBAC)
--
-- company_members.role carries the member's primary role; this table lets one
-- member hold several roles on the same company and records who granted them.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_member_roles (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    -- 'company_owner', 'org_admin', 'recruiter_admin', 'hiring_manager',
    -- 'recruiter', 'employee', 'viewer'
    role VARCHAR(40) NOT NULL,
    -- Grants beyond the role's baseline. Never used to take permissions away,
    -- so a narrower role can't be widened by accident.
    extra_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    granted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_member_role UNIQUE (company_id, user_id, role),
    CONSTRAINT company_member_roles_role_check CHECK (
        role IN ('company_owner', 'org_admin', 'recruiter_admin', 'hiring_manager',
                 'recruiter', 'employee', 'viewer')
    )
);

CREATE INDEX IF NOT EXISTS idx_company_member_roles_company ON company_member_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_company_member_roles_user ON company_member_roles(company_id, user_id);

-- ---------------------------------------------------------------------------
-- 6. Invitations
--
-- Only the SHA-256 of the invitation token is stored; the plaintext exists once
-- in the email or link handed to the invitee and is never recoverable from a
-- database dump.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_invitations (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    invited_user_id UUID,
    role VARCHAR(40) NOT NULL,
    association_type VARCHAR(40) NOT NULL DEFAULT 'current_employee',
    department_id UUID REFERENCES company_departments(id) ON DELETE SET NULL,
    job_title VARCHAR(200),
    message TEXT,
    token_hash CHAR(64) NOT NULL UNIQUE,
    -- 'pending', 'accepted', 'declined', 'expired', 'revoked'
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    channel VARCHAR(20) NOT NULL DEFAULT 'email', -- 'email', 'notification', 'link'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    invited_by UUID NOT NULL,
    accepted_by UUID,
    accepted_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT company_invitations_status_check CHECK (
        status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')
    ),
    CONSTRAINT company_invitations_role_check CHECK (
        role IN ('company_owner', 'org_admin', 'recruiter_admin', 'hiring_manager',
                 'recruiter', 'employee', 'viewer')
    )
);

CREATE INDEX IF NOT EXISTS idx_company_invitations_company ON company_invitations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON company_invitations(lower(email));
CREATE INDEX IF NOT EXISTS idx_company_invitations_expiry ON company_invitations(expires_at) WHERE status = 'pending';
-- One live invitation per address per company; re-inviting revokes the old one.
CREATE UNIQUE INDEX IF NOT EXISTS uq_company_invitations_pending
    ON company_invitations(company_id, lower(email)) WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- 7. Verification
--
-- company_verification_requests (0011) stays as the submission record. These
-- tables carry the reviewed state and the documents behind it.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_verifications (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    -- 'not_verified', 'pending', 'verified', 'rejected', 'expired'
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    legal_name VARCHAR(255),
    registration_number VARCHAR(120),
    registration_country VARCHAR(100),
    contact_email VARCHAR(255),
    submitted_by UUID NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Set only by a platform administrator. Nothing in the company module may
    -- write these columns.
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT company_verifications_status_check CHECK (
        status IN ('not_verified', 'pending', 'verified', 'rejected', 'expired')
    )
);

CREATE INDEX IF NOT EXISTS idx_company_verifications_company ON company_verifications(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_verifications_status ON company_verifications(status);
-- A company may not have two reviews open at once.
CREATE UNIQUE INDEX IF NOT EXISTS uq_company_verifications_pending
    ON company_verifications(company_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS company_verification_documents (
    id UUID PRIMARY KEY,
    verification_id UUID NOT NULL REFERENCES company_verifications(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_type VARCHAR(60) NOT NULL, -- 'registration_certificate', 'tax_document', 'domain_proof', 'identity', 'other'
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    mime_type VARCHAR(120) NOT NULL,
    checksum CHAR(64),
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_company_verification_documents_verification
    ON company_verification_documents(verification_id);

-- ---------------------------------------------------------------------------
-- 8. Company jobs
--
-- Nothing to add: jobs (0043b) already carries company_id, status, counters and
-- publication timestamps. The company module reads and filters that table; job
-- creation stays in the jobs/recruiter modules.
-- ---------------------------------------------------------------------------
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS unique_views_count INT NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- 9. Followers: notification preferences on the existing follow edge
-- ---------------------------------------------------------------------------
ALTER TABLE company_followers ADD COLUMN IF NOT EXISTS notify_updates BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE company_followers ADD COLUMN IF NOT EXISTS notify_jobs BOOLEAN NOT NULL DEFAULT TRUE;

-- ---------------------------------------------------------------------------
-- 10. Company updates (posts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_updates (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    -- 'text', 'image', 'link', 'job_announcement', 'hiring_announcement',
    -- 'news', 'event'
    type VARCHAR(40) NOT NULL DEFAULT 'text',
    title VARCHAR(255),
    body TEXT NOT NULL,
    media JSONB NOT NULL DEFAULT '[]'::jsonb,
    links JSONB NOT NULL DEFAULT '[]'::jsonb,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    -- 'draft', 'scheduled', 'published', 'archived'
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    views_count INT NOT NULL DEFAULT 0,
    reactions_count INT NOT NULL DEFAULT 0,
    comments_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT company_updates_status_check CHECK (
        status IN ('draft', 'scheduled', 'published', 'archived')
    ),
    CONSTRAINT company_updates_type_check CHECK (
        type IN ('text', 'image', 'link', 'job_announcement', 'hiring_announcement', 'news', 'event')
    ),
    CONSTRAINT company_updates_schedule_check CHECK (
        status <> 'scheduled' OR scheduled_at IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_company_updates_company ON company_updates(company_id, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_updates_due ON company_updates(scheduled_at) WHERE status = 'scheduled';

-- ---------------------------------------------------------------------------
-- 11. Reviews
--
-- Ratings are 1-5. The unique index below is the control that stops one user
-- filing repeated reviews for the same stint at the same company.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_reviews (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    -- 'current_employee', 'former_employee', 'contractor', 'intern'
    employment_type VARCHAR(40) NOT NULL,
    -- Approximate period, stored to the month; the exact dates are not asked for.
    employment_started_on DATE,
    employment_ended_on DATE,
    job_title VARCHAR(200),
    overall_rating SMALLINT NOT NULL,
    work_life_balance SMALLINT,
    compensation_rating SMALLINT,
    culture_rating SMALLINT,
    management_rating SMALLINT,
    career_growth_rating SMALLINT,
    title VARCHAR(255),
    summary TEXT NOT NULL,
    pros TEXT,
    cons TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
    -- 'published', 'under_review', 'removed'
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    reports_count INT NOT NULL DEFAULT 0,
    company_response TEXT,
    company_response_by UUID,
    company_response_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT company_reviews_status_check CHECK (status IN ('published', 'under_review', 'removed')),
    CONSTRAINT company_reviews_employment_type_check CHECK (
        employment_type IN ('current_employee', 'former_employee', 'contractor', 'intern')
    ),
    CONSTRAINT company_reviews_overall_range CHECK (overall_rating BETWEEN 1 AND 5),
    CONSTRAINT company_reviews_category_range CHECK (
        (work_life_balance    IS NULL OR work_life_balance    BETWEEN 1 AND 5) AND
        (compensation_rating  IS NULL OR compensation_rating  BETWEEN 1 AND 5) AND
        (culture_rating       IS NULL OR culture_rating       BETWEEN 1 AND 5) AND
        (management_rating    IS NULL OR management_rating    BETWEEN 1 AND 5) AND
        (career_growth_rating IS NULL OR career_growth_rating BETWEEN 1 AND 5)
    ),
    CONSTRAINT company_reviews_period_order CHECK (
        employment_ended_on IS NULL OR employment_started_on IS NULL
        OR employment_ended_on >= employment_started_on
    )
);

CREATE INDEX IF NOT EXISTS idx_company_reviews_company ON company_reviews(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_reviews_user ON company_reviews(user_id);
-- One review per user per employment stint at a company.
CREATE UNIQUE INDEX IF NOT EXISTS uq_company_reviews_employment
    ON company_reviews(company_id, user_id, employment_type, COALESCE(employment_started_on, DATE '0001-01-01'))
    WHERE status <> 'removed';

CREATE TABLE IF NOT EXISTS company_review_reports (
    id UUID PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES company_reviews(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL,
    reason VARCHAR(80) NOT NULL, -- 'spam', 'harassment', 'confidential_information', 'inaccurate', 'other'
    details TEXT,
    -- 'open', 'upheld', 'dismissed'
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_review_report UNIQUE (review_id, reporter_id),
    CONSTRAINT company_review_reports_status_check CHECK (status IN ('open', 'upheld', 'dismissed'))
);

CREATE INDEX IF NOT EXISTS idx_company_review_reports_open
    ON company_review_reports(company_id) WHERE status = 'open';

-- ---------------------------------------------------------------------------
-- 12. Analytics
--
-- Raw view events feed the daily rollups; the dashboard reads the rollups.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_profile_views (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    viewer_id UUID,
    -- Salted hash of the client identity for signed-out visitors, so unique
    -- visitor counts do not require storing an IP address.
    visitor_hash CHAR(64),
    source VARCHAR(60),
    viewed_on DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_company_profile_views_company_day
    ON company_profile_views(company_id, viewed_on);

CREATE TABLE IF NOT EXISTS company_analytics (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    profile_views INT NOT NULL DEFAULT 0,
    unique_visitors INT NOT NULL DEFAULT 0,
    followers INT NOT NULL DEFAULT 0,
    follower_growth INT NOT NULL DEFAULT 0,
    job_views INT NOT NULL DEFAULT 0,
    applications INT NOT NULL DEFAULT 0,
    interviews INT NOT NULL DEFAULT 0,
    offers INT NOT NULL DEFAULT 0,
    hires INT NOT NULL DEFAULT 0,
    recruiter_actions INT NOT NULL DEFAULT 0,
    candidate_sources JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_analytics_day UNIQUE (company_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_company_analytics_company_date
    ON company_analytics(company_id, metric_date DESC);

CREATE TABLE IF NOT EXISTS company_job_analytics (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    views INT NOT NULL DEFAULT 0,
    unique_views INT NOT NULL DEFAULT 0,
    applications INT NOT NULL DEFAULT 0,
    qualified_applications INT NOT NULL DEFAULT 0,
    shortlisted INT NOT NULL DEFAULT 0,
    interviews INT NOT NULL DEFAULT 0,
    offers INT NOT NULL DEFAULT 0,
    hires INT NOT NULL DEFAULT 0,
    total_review_minutes BIGINT NOT NULL DEFAULT 0,
    reviewed_applications INT NOT NULL DEFAULT 0,
    total_hire_minutes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_job_analytics_day UNIQUE (job_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_company_job_analytics_company
    ON company_job_analytics(company_id, metric_date DESC);

-- ---------------------------------------------------------------------------
-- 13. Audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_audit_logs (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    actor_id UUID,
    action VARCHAR(80) NOT NULL,
    resource_type VARCHAR(60) NOT NULL,
    resource_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_company_audit_logs_company
    ON company_audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_audit_logs_actor ON company_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_company_audit_logs_action ON company_audit_logs(company_id, action);

-- ---------------------------------------------------------------------------
-- 14. Backfill: every existing company gets an owner record and a profile row
-- ---------------------------------------------------------------------------
UPDATE companies c
SET owner_id = m.user_id
FROM company_members m
WHERE c.owner_id IS NULL
  AND m.company_id = c.id
  AND m.role IN ('admin', 'owner', 'company_owner');

INSERT INTO company_profiles (company_id)
SELECT c.id FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM company_profiles p WHERE p.company_id = c.id);

-- Legacy roles map onto the new vocabulary.
UPDATE company_members SET role = 'company_owner' WHERE role IN ('admin', 'owner');
UPDATE company_members SET role = 'org_admin'     WHERE role = 'editor';

INSERT INTO company_member_roles (id, company_id, member_id, user_id, role, granted_by)
SELECT gen_random_uuid(), m.company_id, m.id, m.user_id, m.role, m.user_id
FROM company_members m
WHERE m.company_id IS NOT NULL
  AND m.role IN ('company_owner', 'org_admin', 'recruiter_admin', 'hiring_manager',
                 'recruiter', 'employee', 'viewer')
ON CONFLICT (company_id, user_id, role) DO NOTHING;
