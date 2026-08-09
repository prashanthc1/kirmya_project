-- down migration: drop candidate application tracker tables

DROP TABLE IF EXISTS application_analytics;
DROP TABLE IF EXISTS interview_reminders;
DROP TABLE IF EXISTS application_notes;
DROP TABLE IF EXISTS candidate_documents;
DROP TABLE IF EXISTS job_alerts;
DROP TABLE IF EXISTS saved_jobs;
DROP TABLE IF EXISTS saved_job_collections;
