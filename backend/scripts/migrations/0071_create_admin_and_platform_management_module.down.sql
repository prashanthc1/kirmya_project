-- Migration 0071 Down: Revert Admin Announcements and Performance Indexes

DROP INDEX IF EXISTS idx_admin_announcements_created;
DROP INDEX IF EXISTS idx_feature_flags_env_enabled;
DROP INDEX IF EXISTS idx_admin_audit_logs_admin_action;
DROP TABLE IF EXISTS admin_announcements;
