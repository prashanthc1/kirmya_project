-- down migration: drop messaging and realtime module tables

DROP TABLE IF EXISTS message_reactions;
DROP TABLE IF EXISTS message_reports;
DROP TABLE IF EXISTS message_reads;
DROP TABLE IF EXISTS conversation_participants;
DROP TABLE IF EXISTS message_requests;
