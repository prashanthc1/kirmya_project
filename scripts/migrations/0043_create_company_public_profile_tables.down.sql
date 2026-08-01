-- down migration: drop company public profile sub-tables

DROP TABLE IF EXISTS company_reports;
DROP TABLE IF EXISTS company_gallery;
DROP TABLE IF EXISTS company_leaders;
DROP TABLE IF EXISTS company_locations;
DROP TABLE IF EXISTS company_departments;
