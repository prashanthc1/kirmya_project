-- Migration 0058 Down: Drop Trust & Safety Module Tables
DROP TABLE IF EXISTS safety_sla_rules CASCADE;
DROP TABLE IF EXISTS safety_rules CASCADE;
DROP TABLE IF EXISTS safety_moderator_notes CASCADE;
DROP TABLE IF EXISTS safety_appeals CASCADE;
DROP TABLE IF EXISTS safety_restrictions CASCADE;
DROP TABLE IF EXISTS safety_moderation_decisions CASCADE;
DROP TABLE IF EXISTS safety_case_events CASCADE;
DROP TABLE IF EXISTS safety_cases CASCADE;
DROP TABLE IF EXISTS safety_report_evidence CASCADE;
DROP TABLE IF EXISTS safety_reports CASCADE;
DROP TABLE IF EXISTS safety_user_blocks CASCADE;
