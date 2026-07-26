-- up migration: create professional communities platform tables

-- 1. Communities Workspaces
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'industry', -- industry, location, trending
    location VARCHAR(100) DEFAULT '',
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_communities_category ON communities(category);
CREATE INDEX IF NOT EXISTS idx_communities_location ON communities(location);

-- 2. Community Roles List
CREATE TABLE IF NOT EXISTS community_roles (
    id UUID PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE, -- owner, admin, moderator, member
    can_manage_members BOOLEAN NOT NULL DEFAULT FALSE,
    can_moderate_posts BOOLEAN NOT NULL DEFAULT FALSE
);

-- Seed basic community roles
INSERT INTO community_roles (id, role_name, can_manage_members, can_moderate_posts) VALUES
('11111111-2222-3333-4444-555555555555', 'owner', TRUE, TRUE),
('22222222-3333-4444-5555-666666666666', 'admin', TRUE, TRUE),
('33333333-4444-5555-6666-777777777777', 'moderator', FALSE, TRUE),
('44444444-5555-6666-7777-888888888888', 'member', FALSE, FALSE)
ON CONFLICT (role_name) DO NOTHING;

-- 3. Community Memberships
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role_name VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, moderator, member
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_community_membership UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_members_cid ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_uid ON community_members(user_id);

-- 4. Community Posts Feed
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_community_posts_cid ON community_posts(community_id);

-- 5. Community Moderation Reports
CREATE TABLE IF NOT EXISTS community_reports (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL,
    reason TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_community_reports_post ON community_reports(post_id);
