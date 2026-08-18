-- Migration: 0080_create_data_governance_privacy_compliance_module.down.sql
-- Module: Data Governance, Privacy Operations, Compliance & User Rights

DROP TABLE IF EXISTS privacy_policy_versions CASCADE;
DROP TABLE IF EXISTS privacy_incidents CASCADE;
DROP TABLE IF EXISTS data_quality_checks CASCADE;
DROP TABLE IF EXISTS cross_border_transfer_controls CASCADE;
DROP TABLE IF EXISTS third_party_processors CASCADE;
DROP TABLE IF EXISTS data_access_reviews CASCADE;
DROP TABLE IF EXISTS legal_holds CASCADE;
DROP TABLE IF EXISTS retention_policies CASCADE;
DROP TABLE IF EXISTS data_subject_request_events CASCADE;
DROP TABLE IF EXISTS data_inventory_items CASCADE;

ALTER TABLE data_requests
    DROP COLUMN IF EXISTS priority,
    DROP COLUMN IF EXISTS assigned_to,
    DROP COLUMN IF EXISTS notes,
    DROP COLUMN IF EXISTS updated_at;
