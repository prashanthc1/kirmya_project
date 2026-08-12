-- Migration 0054 Down: Drop Centralized Notifications Module Tables
DROP TABLE IF EXISTS notification_audit_logs;
DROP TABLE IF EXISTS notification_webhook_deliveries;
DROP TABLE IF EXISTS notification_webhooks;
DROP TABLE IF EXISTS notification_failures;
DROP TABLE IF EXISTS notification_digest_items;
DROP TABLE IF EXISTS notification_digests;
DROP TABLE IF EXISTS notification_groups;
DROP TABLE IF EXISTS notification_templates;
DROP TABLE IF EXISTS notification_devices;
DROP TABLE IF EXISTS notification_deliveries;
DROP TABLE IF EXISTS quiet_hours_settings;
DROP TABLE IF EXISTS notification_preference_categories;
DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS notification_events;
DROP TABLE IF EXISTS notifications;
