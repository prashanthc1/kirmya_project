-- up migration: create performance indexes and constraints for secondary business domains

-- 1. Notifications Lookup & Unread Filtering Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_category ON notifications(user_id, category);

-- 2. Communities Posts and Comments Timeline Indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_members_lookup ON community_members(community_id, user_id, status);

-- 3. Trust & Safety Fast Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_safety_reports_reporter ON safety_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_status ON safety_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_user_blocks_lookup ON safety_user_blocks(blocker_id, blocked_id);
