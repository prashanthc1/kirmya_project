-- down migration: company and organization management system
--
-- Drops what 0052 created and removes the columns it added. Tables from 0011,
-- 0042 and 0043 survive; only their added columns are reverted.

DROP TABLE IF EXISTS company_audit_logs;
DROP TABLE IF EXISTS company_job_analytics;
DROP TABLE IF EXISTS company_analytics;
DROP TABLE IF EXISTS company_profile_views;
DROP TABLE IF EXISTS company_review_reports;
DROP TABLE IF EXISTS company_reviews;
DROP TABLE IF EXISTS company_updates;
DROP TABLE IF EXISTS company_verification_documents;
DROP TABLE IF EXISTS company_verifications;
DROP TABLE IF EXISTS company_invitations;
DROP TABLE IF EXISTS company_member_roles;

ALTER TABLE company_followers DROP COLUMN IF EXISTS notify_updates;
ALTER TABLE company_followers DROP COLUMN IF EXISTS notify_jobs;

ALTER TABLE jobs DROP COLUMN IF EXISTS unique_views_count;


ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_status_check;
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_association_type_check;
ALTER TABLE company_members DROP COLUMN IF EXISTS department_id;
ALTER TABLE company_members DROP COLUMN IF EXISTS job_title;
ALTER TABLE company_members DROP COLUMN IF EXISTS location;
ALTER TABLE company_members DROP COLUMN IF EXISTS association_type;
ALTER TABLE company_members DROP COLUMN IF EXISTS status;
ALTER TABLE company_members DROP COLUMN IF EXISTS is_public;
ALTER TABLE company_members DROP COLUMN IF EXISTS started_at;
ALTER TABLE company_members DROP COLUMN IF EXISTS ended_at;
ALTER TABLE company_members DROP COLUMN IF EXISTS invited_by;
ALTER TABLE company_members DROP COLUMN IF EXISTS approved_by;
ALTER TABLE company_members DROP COLUMN IF EXISTS approved_at;
ALTER TABLE company_members DROP COLUMN IF EXISTS updated_at;

DROP INDEX IF EXISTS uq_company_departments_name;
DROP INDEX IF EXISTS idx_company_departments_company;
ALTER TABLE company_departments DROP COLUMN IF EXISTS description;
ALTER TABLE company_departments DROP COLUMN IF EXISTS created_at;

ALTER TABLE company_locations DROP COLUMN IF EXISTS state;
ALTER TABLE company_locations DROP COLUMN IF EXISTS postal_code;
ALTER TABLE company_locations DROP COLUMN IF EXISTS is_headquarters;
ALTER TABLE company_locations DROP COLUMN IF EXISTS created_at;

ALTER TABLE company_profiles DROP CONSTRAINT IF EXISTS company_profiles_verification_status_check;
DROP INDEX IF EXISTS idx_company_profiles_industry;
DROP INDEX IF EXISTS idx_company_profiles_verification;
DROP INDEX IF EXISTS idx_company_profiles_hiring;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS tagline;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS company_type;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS headquarters;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS contact_email;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS contact_phone;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS social_links;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS brand_assets;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS specialties;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS core_values;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS mission;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS vision;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS history;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS work_culture;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS career_info;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS products;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS services;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS industries;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS technology;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS awards;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS certifications;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS operating_countries;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS employees_count;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS open_jobs_count;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS review_count;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS rating;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS profile_completion;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS is_hiring;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS verification_status;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS verified_at;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS verification_expires_at;

DROP INDEX IF EXISTS idx_companies_owner;
DROP INDEX IF EXISTS idx_companies_organization;
DROP INDEX IF EXISTS idx_companies_status;
ALTER TABLE companies DROP COLUMN IF EXISTS owner_id;
ALTER TABLE companies DROP COLUMN IF EXISTS organization_id;
ALTER TABLE companies DROP COLUMN IF EXISTS status;
ALTER TABLE companies DROP COLUMN IF EXISTS created_by;
ALTER TABLE companies DROP COLUMN IF EXISTS updated_at;
