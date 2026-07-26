-- Up Migration: Create Freelance Marketplace Subsystem Tables

-- 1. Freelancer Profiles Table
CREATE TABLE IF NOT EXISTS freelancer_profiles (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    tagline TEXT NOT NULL,
    skills JSONB DEFAULT '[]'::jsonb,
    portfolio_links JSONB DEFAULT '[]'::jsonb,
    availability_status VARCHAR(50) DEFAULT 'available', -- 'available', 'busy'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_user ON freelancer_profiles(user_id);

-- 2. Projects Table (Short-Term Opportunities)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget NUMERIC(10, 2) NOT NULL,
    budget_type VARCHAR(50) DEFAULT 'fixed', -- 'fixed', 'hourly'
    skills_required JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 3. Proposals Table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL,
    bid_amount NUMERIC(10, 2) NOT NULL,
    estimated_days INT NOT NULL,
    cover_letter TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'accepted', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proposals_project ON proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_freelancer ON proposals(freelancer_id);

-- 4. Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    freelancer_id UUID NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_freelancer ON contracts(freelancer_id);
