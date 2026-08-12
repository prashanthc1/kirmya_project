-- down migration: drop job alerts and recommendation engine tables

DROP TABLE IF EXISTS job_views;
DROP TABLE IF EXISTS job_search_history;
DROP TABLE IF EXISTS alert_delivery_history;
DROP TABLE IF EXISTS candidate_career_preferences;
DROP TABLE IF EXISTS recommendation_feedback;
DROP TABLE IF EXISTS recommendation_history;
DROP TABLE IF EXISTS saved_searches;
