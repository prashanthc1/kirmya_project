-- down migration: drop cover letter system tables

DROP TABLE IF EXISTS cover_letter_analytics;
DROP TABLE IF EXISTS cover_letter_application_usage;
DROP TABLE IF EXISTS cover_letter_job_matches;
DROP TABLE IF EXISTS cover_letter_shares;
DROP TABLE IF EXISTS cover_letter_templates;
DROP TABLE IF EXISTS cover_letter_versions;
DROP TABLE IF EXISTS cover_letter_sections;
DROP TABLE IF EXISTS cover_letters;
