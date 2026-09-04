-- down migration: drop canonical file and media management system

DROP TABLE IF EXISTS file_attachments CASCADE;
DROP TABLE IF EXISTS files CASCADE;
