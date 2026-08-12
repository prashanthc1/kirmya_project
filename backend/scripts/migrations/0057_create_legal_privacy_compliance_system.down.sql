-- Migration 0057 Down: Drop Legal, Privacy, Compliance & Consent System Tables
DROP TABLE IF EXISTS privacy_incidents CASCADE;
DROP TABLE IF EXISTS third_party_services CASCADE;
DROP TABLE IF EXISTS legal_holds CASCADE;
DROP TABLE IF EXISTS retention_policies CASCADE;
DROP TABLE IF EXISTS data_deletion_requests CASCADE;
DROP TABLE IF EXISTS data_export_jobs CASCADE;
DROP TABLE IF EXISTS privacy_requests CASCADE;
DROP TABLE IF EXISTS cookie_consents CASCADE;
DROP TABLE IF EXISTS cookie_registry CASCADE;
DROP TABLE IF EXISTS legal_document_acceptances CASCADE;
DROP TABLE IF EXISTS legal_document_versions CASCADE;
DROP TABLE IF EXISTS legal_documents CASCADE;
