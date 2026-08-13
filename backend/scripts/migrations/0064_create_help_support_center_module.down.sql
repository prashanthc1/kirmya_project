-- Migration 0064 Down: Drop Support Center Tables
DROP TABLE IF EXISTS support_bug_reports CASCADE;
DROP TABLE IF EXISTS support_feature_requests CASCADE;
DROP TABLE IF EXISTS support_ticket_history CASCADE;
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS support_article_feedback CASCADE;
DROP TABLE IF EXISTS support_article_revisions CASCADE;
DROP TABLE IF EXISTS support_articles CASCADE;
DROP TABLE IF EXISTS support_article_categories CASCADE;
