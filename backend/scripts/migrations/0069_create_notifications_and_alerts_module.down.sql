-- down migration: drop notification deduplication and broadcast tables

DROP TABLE IF EXISTS notification_broadcasts;
DROP TABLE IF EXISTS notification_deduplication;
