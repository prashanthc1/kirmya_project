-- Migration 0066 Down: Drop Profile Module Extensions
DROP TABLE IF EXISTS user_profile_reports CASCADE;
DROP TABLE IF EXISTS user_profile_analytics CASCADE;
DROP TABLE IF EXISTS user_educations CASCADE;
DROP TABLE IF EXISTS user_work_experiences CASCADE;
