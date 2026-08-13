-- Migration 0061 Down: Drop Privacy & Data Protection Tables
DROP TABLE IF EXISTS data_processing_records CASCADE;
DROP TABLE IF EXISTS privacy_audit_events CASCADE;
DROP TABLE IF EXISTS privacy_preferences CASCADE;
