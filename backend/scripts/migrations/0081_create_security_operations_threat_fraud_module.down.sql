-- Migration 0081 Down: Rollback Security Operations, Threat Detection, Fraud Prevention & Abuse Protection Module

DROP TABLE IF EXISTS security_event_details;
DROP TABLE IF EXISTS fraud_alerts;
DROP TABLE IF EXISTS bot_detection_signals;
DROP TABLE IF EXISTS account_risk_scores;
DROP TABLE IF EXISTS security_rules;
DROP TABLE IF EXISTS security_alerts;
