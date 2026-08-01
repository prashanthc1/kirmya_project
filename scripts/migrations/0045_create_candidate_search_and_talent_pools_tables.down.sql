-- down migration: drop candidate search, talent pools and saved searches tables

DROP TABLE IF EXISTS candidate_profile_views;
DROP TABLE IF EXISTS recruiter_saved_searches;
DROP TABLE IF EXISTS talent_pool_candidates;
DROP TABLE IF EXISTS talent_pools;
