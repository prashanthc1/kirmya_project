-- Migration 0062 Down: Drop Security & Identity Protection Tables
DROP TABLE IF EXISTS security_settings CASCADE;
DROP TABLE IF EXISTS security_incidents CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS mfa_recovery_codes CASCADE;
DROP TABLE IF EXISTS mfa_methods CASCADE;
DROP TABLE IF EXISTS trusted_devices CASCADE;
