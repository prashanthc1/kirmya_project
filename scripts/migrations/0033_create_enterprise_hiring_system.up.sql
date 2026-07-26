-- Up Migration: Create Enterprise Hiring System Tables

-- 1. Enterprises Table
CREATE TABLE IF NOT EXISTS enterprises (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    tier VARCHAR(50) DEFAULT 'enterprise_premium',
    domain VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enterprises_domain ON enterprises(domain);

-- 2. Hiring Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY,
    enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
    department_name VARCHAR(100) NOT NULL,
    team_name VARCHAR(150) NOT NULL,
    team_lead_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_enterprise ON teams(enterprise_id);

-- 3. Enterprise RBAC Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY,
    enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_enterprise ON roles(enterprise_id);

-- 4. Candidate Pools & Talent Pipelines Table
CREATE TABLE IF NOT EXISTS candidate_pools (
    id UUID PRIMARY KEY,
    enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    candidate_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_candidate_pools_enterprise ON candidate_pools(enterprise_id);

-- 5. Immutable Security Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_enterprise ON audit_logs(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
