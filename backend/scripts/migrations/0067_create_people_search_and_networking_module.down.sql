-- down migration: drop people search and networking module tables

DROP TABLE IF EXISTS network_analytics;
DROP TABLE IF EXISTS network_reports;
DROP TABLE IF EXISTS recommendation_dismissals;
DROP TABLE IF EXISTS connection_follows;
DROP TABLE IF EXISTS connection_request_notes;
