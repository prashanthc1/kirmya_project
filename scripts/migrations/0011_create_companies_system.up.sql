-- up migration: create company registry and profiles database tables

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    handle VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_handle ON companies(handle);

-- 2. Company Profiles Table
CREATE TABLE IF NOT EXISTS company_profiles (
    company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    logo_url TEXT,
    cover_url TEXT,
    about TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    location VARCHAR(150),
    website VARCHAR(255),
    founded_year INT,
    culture TEXT,
    benefits JSONB DEFAULT '[]',
    employee_insights TEXT,
    followers_count INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Company Members Table
CREATE TABLE IF NOT EXISTS company_members (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'employee', -- 'admin', 'editor', 'employee'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);

-- 4. Company Followers Table
CREATE TABLE IF NOT EXISTS company_followers (
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_followers_user ON company_followers(user_id);

-- 5. Company Verification Requests Table
CREATE TABLE IF NOT EXISTS company_verification_requests (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    documents JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
