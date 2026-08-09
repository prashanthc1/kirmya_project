-- down migration: drop the core jobs table
--
-- Every table that references jobs(id) does so with ON DELETE CASCADE or
-- ON DELETE SET NULL, so this must run after those migrations are rolled back.

DROP TABLE IF EXISTS jobs;
