-- down migration: drop resume management system tables

DROP TABLE IF EXISTS resume_job_matches;
DROP TABLE IF EXISTS resume_analytics;
DROP TABLE IF EXISTS resume_shares;
DROP TABLE IF EXISTS resume_templates;
