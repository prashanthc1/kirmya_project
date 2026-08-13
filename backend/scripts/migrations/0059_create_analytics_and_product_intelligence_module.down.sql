-- Migration 0059 Down: Drop Analytics & Product Intelligence Module Tables
DROP TABLE IF EXISTS analytics_exports CASCADE;
DROP TABLE IF EXISTS analytics_funnels CASCADE;
DROP TABLE IF EXISTS analytics_cohorts CASCADE;
DROP TABLE IF EXISTS analytics_daily_safety CASCADE;
DROP TABLE IF EXISTS analytics_daily_support CASCADE;
DROP TABLE IF EXISTS analytics_daily_ai CASCADE;
DROP TABLE IF EXISTS analytics_daily_messages CASCADE;
DROP TABLE IF EXISTS analytics_daily_communities CASCADE;
DROP TABLE IF EXISTS analytics_daily_companies CASCADE;
DROP TABLE IF EXISTS analytics_daily_recruiters CASCADE;
DROP TABLE IF EXISTS analytics_daily_jobs CASCADE;
DROP TABLE IF EXISTS analytics_daily_users CASCADE;
DROP TABLE IF EXISTS analytics_event_failures CASCADE;
DROP TABLE IF EXISTS analytics_events_v2 CASCADE;
