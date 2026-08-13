-- Migration 0060 Down: Drop Notification & Communication Engine Tables
DROP TABLE IF EXISTS notification_rate_limits CASCADE;
DROP TABLE IF EXISTS notification_suppression_rules CASCADE;
DROP TABLE IF EXISTS notification_push_events CASCADE;
DROP TABLE IF EXISTS notification_sms_events CASCADE;
DROP TABLE IF EXISTS notification_email_events CASCADE;
DROP TABLE IF EXISTS notification_schedules CASCADE;
