-- down migration: drop ATS pipeline and offer tables

DROP TABLE IF EXISTS candidate_assignments;
DROP TABLE IF EXISTS job_offers;
DROP TABLE IF EXISTS interview_feedback;
DROP TABLE IF EXISTS application_stage_history;
DROP TABLE IF EXISTS job_applications;
