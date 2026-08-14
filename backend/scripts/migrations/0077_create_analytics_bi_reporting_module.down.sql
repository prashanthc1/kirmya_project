-- Migration: 0077_create_analytics_bi_reporting_module.down.sql

DROP TABLE IF EXISTS analytics_scheduled_reports CASCADE;
DROP TABLE IF EXISTS analytics_reports CASCADE;
DROP TABLE IF EXISTS analytics_daily_metrics CASCADE;
DROP TABLE IF EXISTS analytics_events_v2 CASCADE;
