-- down migration: drop secondary business domain indexes
DROP INDEX IF EXISTS idx_safety_user_blocks_lookup;
DROP INDEX IF EXISTS idx_safety_reports_status;
DROP INDEX IF EXISTS idx_safety_reports_reporter;
DROP INDEX IF EXISTS idx_community_members_lookup;
DROP INDEX IF EXISTS idx_community_posts_created;
DROP INDEX IF EXISTS idx_notifications_user_category;
DROP INDEX IF EXISTS idx_notifications_user_read;
