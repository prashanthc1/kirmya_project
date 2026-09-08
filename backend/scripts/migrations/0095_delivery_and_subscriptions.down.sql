DROP TABLE IF EXISTS job_alert_matches;
DROP TABLE IF EXISTS newsletter_subscriptions;

DROP INDEX IF EXISTS idx_job_alerts_active_watermark;
ALTER TABLE job_alerts DROP COLUMN IF EXISTS last_matched_at;

DROP INDEX IF EXISTS idx_notification_deliveries_unique_channel;
DROP INDEX IF EXISTS idx_notification_deliveries_due;
