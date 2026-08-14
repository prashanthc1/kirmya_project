-- down migration: drop support search queries table and indexes

DROP TABLE IF EXISTS support_search_queries;
DROP INDEX IF EXISTS idx_support_tickets_user_status;
DROP INDEX IF EXISTS idx_support_articles_cat_status;
