-- down migration: drop onboarding system tables

DROP TABLE IF EXISTS job_alert_preferences;
DROP TABLE IF EXISTS career_preferences;
DROP TABLE IF EXISTS profile_completion;
DROP TABLE IF EXISTS onboarding_progress;
