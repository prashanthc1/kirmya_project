-- down migration: drop interview preparation system tables

DROP TABLE IF EXISTS ai_coach_sessions;
DROP TABLE IF EXISTS interview_readiness_scores;
DROP TABLE IF EXISTS interview_notes;
DROP TABLE IF EXISTS preparation_tasks;
DROP TABLE IF EXISTS mock_interview_answers;
DROP TABLE IF EXISTS mock_interview_sessions;
DROP TABLE IF EXISTS interview_question_library;
DROP TABLE IF EXISTS interview_preparations;
