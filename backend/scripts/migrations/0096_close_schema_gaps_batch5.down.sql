DROP TABLE IF EXISTS recommendation_user_preferences;
ALTER TABLE recommendation_feedback DROP COLUMN IF EXISTS feedback_reason, DROP COLUMN IF EXISTS action_type;
ALTER TABLE retention_policies DROP COLUMN IF EXISTS created_at;
ALTER TABLE privacy_incidents
    DROP COLUMN IF EXISTS summary,
    DROP COLUMN IF EXISTS reported_at,
    DROP COLUMN IF EXISTS reported_by,
    DROP COLUMN IF EXISTS impacted_user_count,
    DROP COLUMN IF EXISTS breach_type;
ALTER TABLE security_events DROP COLUMN IF EXISTS severity;
ALTER TABLE security_incidents
    DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS details,
    DROP COLUMN IF EXISTS category,
    DROP COLUMN IF EXISTS incident_number;
DROP TABLE IF EXISTS user_security_settings;
DROP INDEX IF EXISTS idx_mfa_methods_user_method;
ALTER TABLE mfa_methods
    DROP COLUMN IF EXISTS is_verified,
    DROP COLUMN IF EXISTS is_primary,
    DROP COLUMN IF EXISTS secret;
ALTER TABLE mentorship_feedback DROP COLUMN IF EXISTS to_user_id, DROP COLUMN IF EXISTS from_user_id;
ALTER TABLE community_members DROP COLUMN IF EXISTS joined_at;
ALTER TABLE notification_preference_categories
    DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS sms_enabled,
    DROP COLUMN IF EXISTS in_app_enabled,
    DROP COLUMN IF EXISTS push_enabled,
    DROP COLUMN IF EXISTS email_enabled;
DROP TABLE IF EXISTS connection_labels;
DROP TABLE IF EXISTS connection_notes;
DROP TABLE IF EXISTS networking_goals;
