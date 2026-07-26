-- Up Migration: Create Enterprise-Scale Architecture Subsystem Tables

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    org_type VARCHAR(100) NOT NULL, -- 'company', 'recruiter_agency', 'training_provider'
    tenant_domain VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended'
    tier VARCHAR(50) DEFAULT 'enterprise', -- 'basic', 'pro', 'enterprise'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_tenant ON organizations(tenant_domain);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(org_type);

-- 2. Organization Users Table (Memberships & Roles)
CREATE TABLE IF NOT EXISTS organization_users (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL, -- 'org_admin', 'recruiter', 'instructor', 'viewer'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'invited', 'suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_org_user UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_users_org ON organization_users(org_id);
CREATE INDEX IF NOT EXISTS idx_org_users_user ON organization_users(user_id);

-- 3. Organization Permissions Table (RBAC Matrix)
CREATE TABLE IF NOT EXISTS organization_permissions (
    id UUID PRIMARY KEY,
    role VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL, -- 'interviews', 'assessments', 'learning', 'referrals', 'verifications'
    action VARCHAR(100) NOT NULL, -- 'read', 'write', 'delete', 'manage'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_role_resource_action UNIQUE (role, resource, action)
);

CREATE INDEX IF NOT EXISTS idx_org_permissions_role ON organization_permissions(role);
