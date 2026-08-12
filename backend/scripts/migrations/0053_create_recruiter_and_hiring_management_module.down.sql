-- Down Migration: Drop Recruiter & Employer Hiring Management Subsystem Tables

DROP TABLE IF EXISTS candidate_access_logs CASCADE;
DROP TABLE IF EXISTS recruiter_message_templates CASCADE;
DROP TABLE IF EXISTS candidate_tag_assignments CASCADE;
DROP TABLE IF EXISTS candidate_org_tags CASCADE;
DROP TABLE IF EXISTS recruiter_internal_notes CASCADE;
DROP TABLE IF EXISTS candidate_pipeline_stages CASCADE;
DROP TABLE IF EXISTS job_application_questions CASCADE;
DROP TABLE IF EXISTS recruiter_role_permissions CASCADE;
DROP TABLE IF EXISTS recruiter_organization_profiles CASCADE;
