-- up migration: complete communities and professional networking schema

-- 1. Extend communities table
ALTER TABLE communities ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE communities ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'public';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS cover_image_url TEXT DEFAULT '';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS rules TEXT[] DEFAULT '{}';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS member_count INT DEFAULT 1;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS post_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_owner ON communities(owner_id);
CREATE INDEX IF NOT EXISTS idx_communities_visibility ON communities(visibility);

-- 2. Extend community_posts table
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT '';
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT FALSE;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS reactions_count INT DEFAULT 0;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS user_name VARCHAR(255) DEFAULT '';
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS user_avatar TEXT DEFAULT '';
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 3. Create community comments table
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    user_name VARCHAR(255) DEFAULT '',
    user_avatar TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_community_comments_cid ON community_comments(community_id);

-- 4. Create community events table
CREATE TABLE IF NOT EXISTS community_events (
    id UUID PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255) DEFAULT '',
    meeting_url TEXT DEFAULT '',
    organized_by_id UUID NOT NULL,
    attendee_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_community_events_cid ON community_events(community_id, scheduled_at ASC);

-- 5. Create community resources table
CREATE TABLE IF NOT EXISTS community_resources (
    id UUID PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'article',
    shared_by_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_community_resources_cid ON community_resources(community_id, created_at DESC);

-- 6. Create community invites table
CREATE TABLE IF NOT EXISTS community_invites (
    id UUID PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL,
    invited_user_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_community_invite UNIQUE (community_id, invited_user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_invites_user ON community_invites(invited_user_id, status);

-- 7. Create community moderation actions table
CREATE TABLE IF NOT EXISTS community_moderation_actions (
    id UUID PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL,
    target_user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_community_mod_actions_cid ON community_moderation_actions(community_id, created_at DESC);
