-- down migration: drop recruiter system tables

DROP TABLE IF EXISTS candidate_notes;
DROP TABLE IF EXISTS interviews;
DROP TABLE IF EXISTS candidate_pipeline;
DROP TABLE IF EXISTS recruiters;
