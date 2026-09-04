-- down migration: revert 0091

DROP TABLE IF EXISTS community_moderation_actions;
DROP TABLE IF EXISTS community_invites;
DROP TABLE IF EXISTS community_resources;
DROP TABLE IF EXISTS community_events;
DROP TABLE IF EXISTS community_comments;

DROP INDEX IF EXISTS idx_communities_visibility;
DROP INDEX IF EXISTS idx_communities_owner;
DROP INDEX IF EXISTS idx_communities_slug;

ALTER TABLE community_posts DROP COLUMN IF EXISTS updated_at;
ALTER TABLE community_posts DROP COLUMN IF EXISTS reactions_count;
ALTER TABLE community_posts DROP COLUMN IF EXISTS comment_count;
ALTER TABLE community_posts DROP COLUMN IF EXISTS tags;
ALTER TABLE community_posts DROP COLUMN IF EXISTS is_announcement;
ALTER TABLE community_posts DROP COLUMN IF EXISTS is_locked;
ALTER TABLE community_posts DROP COLUMN IF EXISTS is_pinned;
ALTER TABLE community_posts DROP COLUMN IF EXISTS title;

ALTER TABLE communities DROP COLUMN IF EXISTS post_count;
ALTER TABLE communities DROP COLUMN IF EXISTS member_count;
ALTER TABLE communities DROP COLUMN IF EXISTS owner_id;
ALTER TABLE communities DROP COLUMN IF EXISTS skills;
ALTER TABLE communities DROP COLUMN IF EXISTS topics;
ALTER TABLE communities DROP COLUMN IF EXISTS rules;
ALTER TABLE communities DROP COLUMN IF EXISTS cover_image_url;
ALTER TABLE communities DROP COLUMN IF EXISTS logo_url;
ALTER TABLE communities DROP COLUMN IF EXISTS visibility;
ALTER TABLE communities DROP COLUMN IF EXISTS slug;
