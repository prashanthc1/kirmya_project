-- Migration 0065 Down: Drop Onboarding Config & Analytics Tables
DROP TABLE IF EXISTS onboarding_analytics_events CASCADE;
DROP TABLE IF EXISTS onboarding_config CASCADE;
