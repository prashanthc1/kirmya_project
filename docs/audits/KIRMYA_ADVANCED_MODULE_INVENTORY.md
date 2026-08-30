# Kirmya Advanced Business Module Inventory & Domain Audit (Prompt 7/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: AUDIT COMPLETE & ARCHITECTURE MAPPED  
**Scope**: All advanced business domains in `backend/internal/` — AI matching, search/candidate discovery, interview management, compliance, enterprise hiring, recruitment workflows, documents/resumes, and specialized career domains.

---

## 1. Executive Summary

This inventory audits all 20+ advanced business modules in the Kirmya repository. It maps their database schemas, repository implementation strategies (pgx SQL vs in-memory fallback), service layer logic, Gin HTTP routes, frontend consumption, and multi-tenant authorization boundaries.

---

## 2. Advanced Business Module Master Inventory

### 1. AI Job Matching (`internal/ai_job_match`)
* **Purpose**: Computes multi-factor compatibility scores (skills, experience, goals, location, salary) between candidate profiles and job postings, generating match explanations and upskilling action recommendations.
* **Tables**: `ai_job_matches`, `matching_scores`, `matching_feedback`.
* **Migrations**: `0028_create_ai_job_matching_system.up.sql`, `0040_add_production_indexes_and_constraints.up.sql`.
* **Models / Domain**: `domain.AIJobMatch`, `domain.MatchingScore`, `domain.MatchingFeedback`, `domain.RecommendedAction`.
* **Repository**: `repository.MatchingRepository` (`matching_repository.go`) — SQL `INSERT`/`SELECT` on `ai_job_matches` with JSONB parsing.
* **Service**: `service.MatchingService` (`matching_service.go`) — Heuristic & vector scoring with deterministic rule fallback.
* **Handler & Routes**: `delivery/http/matching_handler.go` $\to$ `/api/v1/matches`, `/api/v1/matches/:id`, `/api/v1/matches/calculate`, `/api/v1/matches/:id/feedback`.
* **Frontend**: `frontend/src/features/ai_job_match/` $\to$ `jobMatchesApi.ts`, match badge widgets, candidate match drawers.
* **Dependencies**: None external required (built-in cosine similarity + weighted heuristic scoring; optional Gemini/OpenAI adapter).
* **Classification**: 🟢 Functional with PostgreSQL persistence.

---

### 2. Search & Candidate Discovery (`internal/search` & `internal/candidate_search`)
* **Purpose**: Unified global multi-entity search (jobs, people, companies, communities, courses) and recruiter-dedicated talent search with faceted filtering (skills, location, seniority, availability).
* **Tables**: `search_history`, `search_preferences`, `saved_searches`, `talent_pools`.
* **Migrations**: `0029_create_search_and_discovery_system.up.sql`, `0040_add_production_indexes_and_constraints.up.sql`.
* **Models / Domain**: `domain.SearchResultItem`, `domain.SearchResponse`, `domain.CandidateSearchQuery`, `domain.CandidateSearchResultItem`.
* **Repository**: `repository.SearchRepository` (`search_repository.go`), `adapter.PostgreSQLSearchAdapter` (tsvector / GIN index support).
* **Service**: `service.SearchService` (`search_service.go`) — Sanitized query normalization, blocked user filtering, multi-tier cache integration.
* **Handler & Routes**: `delivery/http/search_handler.go` $\to$ `/api/v1/search`, `/api/v1/search/suggestions`, `/api/v1/search/history`, `/api/v1/search/candidates`, `/api/v1/search/talent-pools`.
* **Frontend**: `frontend/src/features/search/` $\to$ Global search bar, candidate discovery table, talent pool drawer.
* **Dependencies**: PostgreSQL tsvector (primary); OpenSearch / Elasticsearch adapter optional.
* **Classification**: 🟢 Functional with PostgreSQL persistence.

---

### 3. Interview Management (`internal/interview` & `internal/interview_prep`)
* **Purpose**: End-to-end interview scheduling, multi-round coordination, participant calendar RSVP, interviewer scorecards, and candidate availability management.
* **Tables**: `interviews`, `interview_rounds`, `interview_participants`, `interview_feedback`, `candidate_availability`.
* **Migrations**: `0030_create_interview_management_system.up.sql`, `0040_add_production_indexes_and_constraints.up.sql`.
* **Models / Domain**: `domain.Interview`, `domain.InterviewRound`, `domain.InterviewParticipant`, `domain.InterviewFeedback`, `domain.CandidateAvailability`.
* **Repository**: `repository.InterviewRepository` (`interview_repository.go`) — Comprehensive PostgreSQL SQL CRUD across all 5 tables.
* **Service**: `service.InterviewService` (`interview_service.go`) — Time validation (`scheduled_end > scheduled_start`), status state machine, permission check.
* **Handler & Routes**: `delivery/http/interview_handler.go` $\to$ `/api/v1/interviews`, `/api/v1/interviews/:id/rounds`, `/api/v1/interviews/:id/feedback`, `/api/v1/interviews/availability`.
* **Frontend**: `frontend/src/features/interview/` $\to$ Interview calendar, scheduling modal, scorecard form.
* **Dependencies**: WebRTC / Zoom / Google Meet meeting link generators (optional).
* **Classification**: 🟢 Functional with PostgreSQL persistence.

---

### 4. Compliance, Privacy & Governance (`internal/compliance` & `internal/legal`)
* **Purpose**: GDPR / CCPA data subject rights (DSR) data access & erasure requests, candidate consent logging, legal holds, data classification inventory, and audit logging.
* **Tables**: `consent_records`, `data_requests`, `compliance_audit_events`, `legal_holds`, `retention_policies`, `privacy_incidents`.
* **Migrations**: `0032_create_compliance_and_privacy_system.up.sql`.
* **Models / Domain**: `domain.ConsentRecord`, `domain.DataRequest`, `domain.AuditEvent`, `domain.LegalHoldItem`, `domain.PrivacyRiskSummary`.
* **Repository**: `repository.ComplianceRepository` (`compliance_repository.go`) — SQL queries for consent logging, DSR tracking, and legal hold checks.
* **Service**: `service.ComplianceService` (`compliance_service.go`) — DSR workflow lifecycle (`submitted` $\to$ `processing` $\to$ `completed`), export data generator.
* **Handler & Routes**: `delivery/http/compliance_handler.go` & `admin_compliance_handler.go` $\to$ `/api/v1/compliance/consent`, `/api/v1/compliance/data-requests`, `/api/v1/compliance/audit-logs`, `/api/v1/admin/compliance/*`.
* **Frontend**: `frontend/src/features/compliance/` $\to$ Privacy center, cookie consent modal, DSR download view, admin governance board.
* **Dependencies**: None external.
* **Classification**: 🟢 Functional with PostgreSQL persistence.

---

### 5. Enterprise Hiring & Organization (`internal/enterprise_hiring` & `internal/organization`)
* **Purpose**: Enterprise company tenant isolation, multi-department hiring squads, requisitions, candidate pools, and organization-scoped audit trails.
* **Tables**: `enterprises`, `teams`, `candidate_pools`, `enterprise_audit_logs`, `organizations`, `organization_members`.
* **Migrations**: `0031_create_enterprise_hiring_system.up.sql`, `0040_add_production_indexes_and_constraints.up.sql`.
* **Models / Domain**: `domain.Enterprise`, `domain.HiringTeam`, `domain.CandidatePool`, `domain.AuditLog`, `domain.Organization`.
* **Repository**: `repository.EnterpriseRepository` (`enterprise_repository.go`), `repository.OrganizationRepository`.
* **Service**: `service.EnterpriseService`, `service.OrganizationService` — Tenant isolation enforcement, role permission validation.
* **Handler & Routes**: `delivery/http/enterprise_handler.go` $\to$ `/api/v1/enterprise/overview`, `/api/v1/enterprise/teams`, `/api/v1/enterprise/candidate-pools`, `/api/v1/enterprise/audit-logs`.
* **Frontend**: `frontend/src/features/enterprise_hiring/` $\to$ Enterprise talent dashboard, team manager, requisition pipeline.
* **Dependencies**: None external.
* **Classification**: 🟢 Functional with PostgreSQL persistence.

---

### 6. Recruiter ATS & Recruiter AI (`internal/recruiter` & `internal/recruiter_ai`)
* **Purpose**: Recruiter organization onboarding, job publishing, applicant tracking system (ATS) stage pipelines (`applied`, `screening`, `interview`, `offer`, `hired`, `rejected`), candidate notes, and AI candidate summaries.
* **Tables**: `recruiter_organization_profiles`, `recruiter_jobs`, `recruiter_job_applications`, `recruiter_candidate_notes`, `recruiter_candidate_activity`.
* **Migrations**: `0021_create_recruiter_and_ats_system.up.sql`.
* **Models / Domain**: `models.RecruiterOrgProfile`, `models.RecruiterJob`, `models.RecruiterJobApplication`, `models.CandidateNote`.
* **Repository**: `repository.RecruiterRepository` (`recruiter_repo.go`) — PostgreSQL SQL queries for ATS applicant pipeline and candidate activity.
* **Service**: `service.RecruiterService` (`recruiter_service.go`) — Stage transitions, note creation, recruiter authorization.
* **Handler & Routes**: `delivery/http/recruiter_handler.go` $\to$ `/api/v1/recruiter/profile`, `/api/v1/recruiter/jobs`, `/api/v1/recruiter/applications`, `/api/v1/recruiter/pipeline/stage`.
* **Frontend**: `frontend/src/features/recruiter/` $\to$ ATS Kanban board, applicant table, recruiter profile editor.
* **Dependencies**: None external.
* **Classification**: 🟢 Functional with PostgreSQL persistence.

---

### 7. Resume & Resume Analysis (`internal/resume` & `internal/resume_analysis`)
* **Purpose**: Candidate multi-version resume builder, section management (experience, education, skills, projects, certifications), styling tokens, and automated ATS keyword parser.
* **Tables**: `resumes`, `resume_sections`, `resume_analyses`.
* **Migrations**: `0020_create_resume_system.up.sql`, `0027_create_resume_analysis_system.up.sql`.
* **Models / Domain**: `models.Resume`, `models.ResumeSection`, `domain.ResumeAnalysis`.
* **Repository**: `repository.ResumeRepository` (`resume_repo.go`), `repository.ResumeAnalysisRepository`.
* **Service**: `service.ResumeService` (`resume_service.go`), `service.ResumeAnalysisService`.
* **Handler & Routes**: `delivery/http/resume_handler.go` $\to$ `/api/v1/resumes`, `/api/v1/resumes/:id`, `/api/v1/resumes/:id/sections`, `/api/v1/resumes/:id/analyze`.
* **Frontend**: `frontend/src/features/resume/` $\to$ Resume builder canvas, section forms, ATS score card.
* **Dependencies**: None external.
* **Classification**: 🟢 Functional with PostgreSQL persistence.

---

### 8. Assessments & Skill Certifications (`internal/assessment`)
* **Purpose**: Candidate skill assessments, timed quiz evaluations, automated code/scenario scoring, and verified badge issuance.
* **Tables**: `assessments`, `assessment_submissions`, `assessment_badges`.
* **Migrations**: `0026_create_skill_assessment_system.up.sql`.
* **Models / Domain**: `domain.Assessment`, `domain.AssessmentSubmission`, `domain.AssessmentBadge`.
* **Repository**: `repository.AssessmentRepository` (`assessment_repository.go`).
* **Service**: `service.AssessmentService` (`assessment_service.go`).
* **Handler & Routes**: `delivery/http/assessment_handler.go` $\to$ `/api/v1/assessments`, `/api/v1/assessments/:id/submit`.
* **Frontend**: `frontend/src/features/assessment/` $\to$ Assessment quiz taker, skill badge display.
* **Classification**: 🟢 Functional.

---

### 9. Mentorship Platform (`internal/mentorship`)
* **Purpose**: Mentorship matching, session bookings, goal tracking, and mentor-mentee reviews.
* **Tables**: `mentorship_profiles`, `mentorship_sessions`, `mentorship_goals`, `mentorship_reviews`.
* **Migrations**: `0025_create_mentorship_system.up.sql`.
* **Models / Domain**: `models.MentorshipProfile`, `models.MentorshipSession`, `models.MentorshipGoal`.
* **Repository**: `repository.MentorshipRepository` (`postgres_repository.go`).
* **Service**: `service.MentorshipService` (`mentorship_service.go`).
* **Handler & Routes**: `delivery/http/mentorship_handler.go` $\to$ `/api/v1/mentorship/*`.
* **Frontend**: `frontend/src/features/mentorship/` $\to$ Mentor directory, booking flow.
* **Classification**: 🟢 Functional.

---

### 10. Learning & Upskilling (`internal/learning`)
* **Purpose**: Career courses, video modules, progress tracking, and skill gap fulfillment pathways.
* **Tables**: `courses`, `course_enrollments`, `course_lessons`, `course_progress`.
* **Migrations**: `0024_create_learning_system.up.sql`.
* **Models / Domain**: `domain.Course`, `domain.Enrollment`, `domain.LessonProgress`.
* **Repository**: `repository.LearningRepository` (`learning_repository.go`).
* **Service**: `service.LearningService` (`learning_service.go`).
* **Handler & Routes**: `delivery/http/learning_handler.go` $\to$ `/api/v1/learning/*`.
* **Frontend**: `frontend/src/features/learning/` $\to$ Course catalog, lesson player.
* **Classification**: 🟢 Functional.

---

### 11. Freelance & Project Marketplace (`internal/freelance` & `internal/global_marketplace`)
* **Purpose**: Gig and contract project postings, milestone payments, proposals, and escrow states.
* **Tables**: `freelance_projects`, `freelance_proposals`, `freelance_milestones`, `marketplace_items`.
* **Migrations**: `0023_create_freelance_system.up.sql`, `0033_create_global_marketplace_system.up.sql`.
* **Models / Domain**: `domain.FreelanceProject`, `domain.Proposal`, `domain.MarketplaceItem`.
* **Repository**: `repository.FreelanceRepository`, `repository.MarketplaceRepository`.
* **Service**: `service.FreelanceService`, `service.MarketplaceService`.
* **Handler & Routes**: `delivery/http/freelance_handler.go` $\to$ `/api/v1/freelance/*`.
* **Frontend**: `frontend/src/features/freelance/` $\to$ Project board, proposal submission.
* **Classification**: 🟢 Functional.

---

### 12. Workforce Intelligence (`internal/workforce_intelligence`)
* **Purpose**: Labor market analytics, salary benchmarks, talent availability heatmaps, and industry trends.
* **Tables**: `salary_benchmarks`, `skill_demands`, `talent_heatmaps`.
* **Migrations**: `0034_create_workforce_intelligence_system.up.sql`.
* **Models / Domain**: `domain.SalaryBenchmark`, `domain.SkillDemand`, `domain.TalentHeatmap`.
* **Repository**: `repository.IntelligenceRepository` (`intelligence_repository.go`).
* **Service**: `service.IntelligenceService` (`intelligence_service.go`).
* **Handler & Routes**: `delivery/http/intelligence_handler.go` $\to$ `/api/v1/workforce-intelligence/*`.
* **Frontend**: `frontend/src/features/workforce_intelligence/` $\to$ Analytics charts, salary calculator.
* **Classification**: 🟢 Functional.

---

## 3. Module Classification Summary Table

| Domain / Module | Tier | Tables Defined | Repository Type | Auth Scope Enforced | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AI Job Matching** | Core Advanced | `ai_job_matches`, `matching_scores`, `matching_feedback` | PostgreSQL pgx + JSONB | Candidate user_id / Recruiter job_id | 🟢 Functional |
| **Search & Discovery** | Core Advanced | `search_history`, `search_preferences`, `saved_searches` | PostgreSQL pgx + tsvector | Sanitized query / Block filtering | 🟢 Functional |
| **Interview Management** | Core Advanced | `interviews`, `interview_rounds`, `participants`, `feedback` | PostgreSQL pgx SQL | Candidate & Organizer permissions | 🟢 Functional |
| **Compliance & Privacy** | Core Advanced | `consent_records`, `data_requests`, `compliance_audit_events` | PostgreSQL pgx SQL | User DSR / Admin legal review | 🟢 Functional |
| **Enterprise Hiring** | Core Advanced | `enterprises`, `teams`, `candidate_pools`, `audit_logs` | PostgreSQL pgx SQL | Tenant isolation by enterprise_id | 🟢 Functional |
| **Recruiter ATS** | Core Advanced | `recruiter_jobs`, `recruiter_applications`, `candidate_notes` | PostgreSQL pgx SQL | Recruiter org / job ownership | 🟢 Functional |
| **Resume Builder** | Core Advanced | `resumes`, `resume_sections`, `resume_analyses` | PostgreSQL pgx SQL | Candidate user_id ownership | 🟢 Functional |
| **Skill Assessment** | Secondary Adv | `assessments`, `assessment_submissions` | PostgreSQL pgx SQL | Candidate submission isolation | 🟢 Functional |
| **Mentorship** | Secondary Adv | `mentorship_profiles`, `mentorship_sessions` | PostgreSQL pgx SQL | Mentor & Mentee participant check | 🟢 Functional |
| **Learning** | Secondary Adv | `courses`, `course_enrollments`, `course_progress` | PostgreSQL pgx SQL | Enrolled user isolation | 🟢 Functional |
| **Freelance Marketplace** | Secondary Adv | `freelance_projects`, `freelance_proposals` | PostgreSQL pgx SQL | Project owner & Freelancer check | 🟢 Functional |
| **Workforce Intelligence** | Secondary Adv | `salary_benchmarks`, `skill_demands` | PostgreSQL pgx SQL | Public / Enterprise aggregated data | 🟢 Functional |
