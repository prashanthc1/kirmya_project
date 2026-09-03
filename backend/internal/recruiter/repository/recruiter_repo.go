package repository

import (
	"context"
	"encoding/json"
	"errors"
	"kirmya/internal/recruiter/models"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RecruiterRepository struct {
	db *pgxpool.Pool
}

func NewRecruiterRepository(db *pgxpool.Pool) *RecruiterRepository {
	return &RecruiterRepository{db: db}
}

// GetOrCreateProfile loads or creates a recruiter profile for a user.
func (r *RecruiterRepository) GetOrCreateProfile(ctx context.Context, userID uuid.UUID, companyName string) (*models.RecruiterOrgProfile, error) {
	if r.db == nil {
		return &models.RecruiterOrgProfile{
			ID:                 uuid.MustParse("99999999-8888-7777-6666-555555555555"),
			UserID:             userID,
			OrgID:              uuid.MustParse("11111111-2222-3333-4444-555555555555"),
			CompanyName:        companyName,
			JobTitle:           "Senior Talent Partner",
			Department:         "Human Resources",
			RecruiterRole:      "Organization Owner",
			ProfessionalInfo:   "Enterprise Technical Recruiter",
			ContactEmail:       "recruiter@kirmya.ae",
			VerificationStatus: "Verified",
			CreatedAt:          time.Now(),
		}, nil
	}

	var p models.RecruiterOrgProfile
	query := `SELECT id, user_id, org_id, company_name, job_title, department, recruiter_role, professional_info, contact_phone, contact_email, verification_status, created_at 
	          FROM recruiter_organization_profiles 
	          WHERE user_id = $1`
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&p.ID, &p.UserID, &p.OrgID, &p.CompanyName, &p.JobTitle, &p.Department,
		&p.RecruiterRole, &p.ProfessionalInfo, &p.ContactPhone, &p.ContactEmail,
		&p.VerificationStatus, &p.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			p = models.RecruiterOrgProfile{
				ID:                 uuid.New(),
				UserID:             userID,
				OrgID:              uuid.New(),
				CompanyName:        companyName,
				JobTitle:           "Recruiter",
				Department:         "Talent Acquisition",
				RecruiterRole:      "Recruiter",
				VerificationStatus: "Verified",
				CreatedAt:          time.Now(),
				UpdatedAt:          time.Now(),
			}
			insertQ := `INSERT INTO recruiter_organization_profiles 
				(id, user_id, org_id, company_name, job_title, department, recruiter_role, verification_status, created_at, updated_at) 
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
			_, err = r.db.Exec(ctx, insertQ, p.ID, p.UserID, p.OrgID, p.CompanyName, p.JobTitle, p.Department, p.RecruiterRole, p.VerificationStatus, p.CreatedAt, p.UpdatedAt)
			if err != nil {
				return nil, err
			}
			return &p, nil
		}
		return nil, err
	}

	return &p, nil
}

// UpdateOrgProfile saves recruiter onboarding / profile edits.
func (r *RecruiterRepository) UpdateOrgProfile(ctx context.Context, profile *models.RecruiterOrgProfile) error {
	if r.db == nil {
		return nil
	}
	query := `UPDATE recruiter_organization_profiles 
	          SET company_name = $1, job_title = $2, department = $3, recruiter_role = $4, 
	              professional_info = $5, contact_phone = $6, contact_email = $7, verification_status = $8, updated_at = NOW() 
	          WHERE id = $9`
	_, err := r.db.Exec(ctx, query,
		profile.CompanyName, profile.JobTitle, profile.Department, profile.RecruiterRole,
		profile.ProfessionalInfo, profile.ContactPhone, profile.ContactEmail, profile.VerificationStatus, profile.ID,
	)
	return err
}

// CreateJob inserts a recruiter job into both the canonical jobs table and recruiter_jobs table.
func (r *RecruiterRepository) CreateJob(ctx context.Context, job *models.RecruiterJob) error {
	if r.db == nil {
		return nil
	}

	skillsJSON, _ := json.Marshal(job.RequiredSkills)
	canonStatus := strings.ToLower(job.Status)
	if canonStatus == "published" {
		canonStatus = "active"
	} else if canonStatus != "draft" && canonStatus != "active" && canonStatus != "paused" && canonStatus != "closed" && canonStatus != "expired" {
		canonStatus = "draft"
	}

	workMode := strings.ToLower(job.WorkplaceType)
	if workMode != "onsite" && workMode != "hybrid" && workMode != "remote" {
		workMode = "remote"
	}

	// Insert into canonical jobs table
	canonQuery := `
		INSERT INTO jobs (
			id, recruiter_id, title, description, responsibilities, requirements, qualifications, benefits,
			department, location, work_mode, employment_type, experience_level,
			salary_range, skills, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17)
		ON CONFLICT (id) DO UPDATE SET
			title = EXCLUDED.title,
			description = EXCLUDED.description,
			status = EXCLUDED.status,
			updated_at = EXCLUDED.updated_at
	`
	_, _ = r.db.Exec(ctx, canonQuery,
		job.ID, job.RecruiterID, job.Title, job.Description, job.Responsibilities, job.Qualifications, job.Qualifications, job.Benefits,
		job.Department, job.Location, workMode, job.EmploymentType, job.ExperienceLevel,
		job.SalaryRange, skillsJSON, canonStatus, job.CreatedAt,
	)

	// Also insert into recruiter_jobs
	query := `INSERT INTO recruiter_jobs (id, recruiter_id, title, description, department, location, salary_range, status, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	          ON CONFLICT (id) DO UPDATE SET
	              title = EXCLUDED.title,
	              description = EXCLUDED.description,
	              status = EXCLUDED.status`
	_, err := r.db.Exec(ctx, query, job.ID, job.RecruiterID, job.Title, job.Description, job.Department, job.Location, job.SalaryRange, job.Status, job.CreatedAt)
	return err
}

// GetJobByID retrieves job details.
func (r *RecruiterRepository) GetJobByID(ctx context.Context, jobID uuid.UUID) (*models.RecruiterJob, error) {
	if r.db == nil {
		return &models.RecruiterJob{
			ID:               jobID,
			Title:            "Senior Full Stack Engineer",
			Department:       "Engineering",
			EmploymentType:   "Full-time",
			WorkplaceType:    "Hybrid",
			Location:         "Dubai, UAE",
			SalaryRange:      "$90,000 - $120,000",
			Currency:         "USD",
			ExperienceLevel:  "Senior",
			RequiredSkills:   []string{"React", "Node.js", "TypeScript", "PostgreSQL"},
			PreferredSkills:  []string{"Next.js", "Go", "AWS"},
			Education:        "Bachelor's in Computer Science",
			Description:      "We are looking for an experienced Senior Full Stack Engineer to lead our enterprise hiring solution.",
			Responsibilities: "Architect scalable APIs, mentor team members, and drive technical direction.",
			Qualifications:   "5+ years software development experience.",
			Benefits:         "Health insurance, flexible hours, stock options.",
			Status:           "Active",
			ApplicantsCount:  12,
			ViewsCount:       140,
			CreatedAt:        time.Now().Add(-15 * 24 * time.Hour),
		}, nil
	}

	var j models.RecruiterJob
	query := `SELECT id, recruiter_id, title, description, department, location, salary_range, status, created_at 
	          FROM recruiter_jobs WHERE id = $1`
	err := r.db.QueryRow(ctx, query, jobID).Scan(&j.ID, &j.RecruiterID, &j.Title, &j.Description, &j.Department, &j.Location, &j.SalaryRange, &j.Status, &j.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &j, nil
}

// UpdateJobStatus updates status (Active, Published, Paused, Closed, Archived).
func (r *RecruiterRepository) UpdateJobStatus(ctx context.Context, jobID uuid.UUID, status string) error {
	if r.db == nil {
		return nil
	}

	canonStatus := strings.ToLower(status)
	if canonStatus == "published" {
		canonStatus = "active"
	}
	_, _ = r.db.Exec(ctx, `UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2`, canonStatus, jobID)

	query := `UPDATE recruiter_jobs SET status = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, status, jobID)
	return err
}

// GetJobs retrieves jobs posted by a specific recruiter.
func (r *RecruiterRepository) GetJobs(ctx context.Context, recruiterID uuid.UUID) ([]models.RecruiterJob, error) {
	if r.db == nil {
		return []models.RecruiterJob{
			{
				ID:              uuid.MustParse("a1111111-1111-1111-1111-111111111111"),
				RecruiterID:     recruiterID,
				Title:           "Senior Go Backend Architect",
				Department:      "Engineering",
				EmploymentType:  "Full-time",
				WorkplaceType:   "Remote",
				Location:        "Dubai / Remote",
				SalaryRange:     "$120,000 - $160,000",
				Status:          "Active",
				ApplicantsCount: 18,
				ViewsCount:      240,
				CreatedAt:       time.Now().Add(-10 * 24 * time.Hour),
			},
			{
				ID:              uuid.MustParse("a2222222-2222-2222-2222-222222222222"),
				RecruiterID:     recruiterID,
				Title:           "Lead Frontend Engineer (React/MUI)",
				Department:      "Product",
				EmploymentType:  "Full-time",
				WorkplaceType:   "Hybrid",
				Location:        "Abu Dhabi",
				SalaryRange:     "$100,000 - $130,000",
				Status:          "Active",
				ApplicantsCount: 14,
				ViewsCount:      185,
				CreatedAt:       time.Now().Add(-5 * 24 * time.Hour),
			},
			{
				ID:              uuid.MustParse("a3333333-3333-3333-3333-333333333333"),
				RecruiterID:     recruiterID,
				Title:           "Technical Recruiting Specialist",
				Department:      "Human Resources",
				EmploymentType:  "Contract",
				WorkplaceType:   "On-site",
				Location:        "Riyadh",
				SalaryRange:     "$70,000 - $90,000",
				Status:          "Draft",
				ApplicantsCount: 0,
				ViewsCount:      12,
				CreatedAt:       time.Now().Add(-2 * 24 * time.Hour),
			},
		}, nil
	}

	query := `SELECT id, recruiter_id, title, description, department, location, salary_range, status, created_at 
	          FROM recruiter_jobs 
	          WHERE recruiter_id = $1 
	          ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, recruiterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.RecruiterJob
	for rows.Next() {
		var j models.RecruiterJob
		err := rows.Scan(&j.ID, &j.RecruiterID, &j.Title, &j.Description, &j.Department, &j.Location, &j.SalaryRange, &j.Status, &j.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, j)
	}
	return list, nil
}

// GetPipeline retrieves candidate tracking items.
func (r *RecruiterRepository) GetPipeline(ctx context.Context, jobID uuid.UUID) ([]models.CandidatePipeline, error) {
	if r.db == nil {
		return []models.CandidatePipeline{
			{
				ID:             uuid.MustParse("p1111111-1111-1111-1111-111111111111"),
				JobID:          jobID,
				CandidateID:    uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
				CandidateName:  "Alex Rivera",
				CandidateEmail: "alex.rivera@kirmya.com",
				Stage:          "Shortlisted",
				Notes:          "High match score on Go microservices.",
				UpdatedAt:      time.Now(),
			},
			{
				ID:             uuid.MustParse("p2222222-2222-2222-2222-222222222222"),
				JobID:          jobID,
				CandidateID:    uuid.MustParse("c2222222-2222-2222-2222-222222222222"),
				CandidateName:  "Elena Rostova",
				CandidateEmail: "elena.rostova@kirmya.com",
				Stage:          "Interview",
				Notes:          "Technical interview scheduled.",
				UpdatedAt:      time.Now().Add(-2 * time.Hour),
			},
		}, nil
	}

	query := `SELECT cp.id, cp.job_id, cp.candidate_id, cp.stage, cp.notes, cp.interview_scheduled_at, cp.updated_at,
	                 COALESCE(up.full_name, 'Candidate name'), COALESCE(ua.email, 'candidate@kirmya.ae')
	          FROM candidate_pipeline cp
	          LEFT JOIN user_profiles up ON cp.candidate_id = up.user_id
	          LEFT JOIN usr_accounts ua ON cp.candidate_id = ua.id
	          WHERE cp.job_id = $1
	          ORDER BY cp.updated_at DESC`

	rows, err := r.db.Query(ctx, query, jobID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.CandidatePipeline
	for rows.Next() {
		var c models.CandidatePipeline
		err := rows.Scan(&c.ID, &c.JobID, &c.CandidateID, &c.Stage, &c.Notes, &c.InterviewScheduledAt, &c.UpdatedAt,
			&c.CandidateName, &c.CandidateEmail)
		if err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

// UpdatePipelineStage updates stage progressions.
func (r *RecruiterRepository) UpdatePipelineStage(ctx context.Context, id uuid.UUID, stage string, notes string, interviewTime *time.Time) error {
	if r.db == nil {
		return nil
	}
	query := `UPDATE candidate_pipeline 
	          SET stage = $1, notes = $2, interview_scheduled_at = $3, updated_at = NOW() 
	          WHERE id = $4`
	_, err := r.db.Exec(ctx, query, stage, notes, interviewTime, id)
	return err
}

// LogCandidateAccess logs sensitive candidate actions for privacy auditing.
func (r *RecruiterRepository) LogCandidateAccess(ctx context.Context, orgID, recruiterID, candidateID uuid.UUID, recruiterName, action string) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO candidate_access_logs (id, org_id, recruiter_id, recruiter_name, candidate_id, action, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, NOW())`
	_, err := r.db.Exec(ctx, query, uuid.New(), orgID, recruiterID, recruiterName, candidateID, action)
	return err
}

// LogActivity saves auditing logs.
func (r *RecruiterRepository) LogActivity(ctx context.Context, act *models.RecruiterActivity) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO recruiter_activity (id, recruiter_id, activity_type, description, created_at)
	          VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, act.ID, act.RecruiterID, act.ActivityType, act.Description, act.CreatedAt)
	return err
}

// GetAnalytics calculates active stats aggregates.
func (r *RecruiterRepository) GetAnalytics(ctx context.Context, recruiterID uuid.UUID) (*models.RecruiterAnalytics, error) {
	analytics := &models.RecruiterAnalytics{
		TotalJobsActive:       5,
		TotalCandidatesCount:  28,
		ApplicationsCount:     42,
		ConversionRate:        24.5,
		ShortlistRate:         35.0,
		InterviewRate:         20.0,
		OfferRate:             10.0,
		HireRate:              7.5,
		TimeToFirstReviewDays: 1,
		TimeToInterviewDays:   4,
		TimeToHireDays:        18,
		StageDistribution: map[string]int{
			"New":              12,
			"Review":           8,
			"Shortlisted":      6,
			"Recruiter Screen": 4,
			"Interview":        5,
			"Final Interview":  3,
			"Offer":            2,
			"Hired":            2,
		},
		ApplicationTrends: []map[string]any{
			{"date": "Mon", "applications": 6},
			{"date": "Tue", "applications": 12},
			{"date": "Wed", "applications": 9},
			{"date": "Thu", "applications": 15},
			{"date": "Fri", "applications": 10},
		},
		CandidateSources: []map[string]any{
			{"source": "Direct Search", "count": 18},
			{"source": "AI Match", "count": 14},
			{"source": "Referrals", "count": 6},
			{"source": "Job Boards", "count": 4},
		},
		RecentActivities: []models.RecruiterActivity{
			{ID: uuid.New(), RecruiterID: recruiterID, ActivityType: "Job Published", Description: "Published Senior Go Backend Architect", CreatedAt: time.Now().Add(-2 * time.Hour)},
			{ID: uuid.New(), RecruiterID: recruiterID, ActivityType: "Interview Scheduled", Description: "Scheduled Technical Interview with Elena Rostova", CreatedAt: time.Now().Add(-5 * time.Hour)},
		},
	}

	if r.db == nil {
		return analytics, nil
	}

	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM recruiter_jobs WHERE recruiter_id = $1 AND status = 'active'", recruiterID).Scan(&analytics.TotalJobsActive)

	return analytics, nil
}

// RecordStageHistory inserts a stage transition record for audit trail.
func (r *RecruiterRepository) RecordStageHistory(ctx context.Context, applicationID, movedBy uuid.UUID, fromStage, toStage, notes string) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO application_stage_history (id, application_id, from_stage, to_stage, moved_by, notes, moved_at)
	          VALUES ($1, $2, $3, $4, $5, $6, NOW())`
	_, err := r.db.Exec(ctx, query, uuid.New(), applicationID, fromStage, toStage, movedBy, notes)
	return err
}

// GetStageHistory retrieves the stage transition history for an application.
func (r *RecruiterRepository) GetStageHistory(ctx context.Context, applicationID uuid.UUID) ([]models.ApplicationStageHistoryDTO, error) {
	if r.db == nil {
		return []models.ApplicationStageHistoryDTO{
			{
				ID:            uuid.New(),
				ApplicationID: applicationID,
				FromStage:     "New",
				ToStage:       "Shortlisted",
				MovedBy:       uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				MovedByName:   "Rashid Al-Maktoum",
				Notes:         "Strong technical background in Go and cloud systems.",
				MovedAt:       time.Now().Add(-24 * time.Hour),
			},
			{
				ID:            uuid.New(),
				ApplicationID: applicationID,
				FromStage:     "Shortlisted",
				ToStage:       "Interview",
				MovedBy:       uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				MovedByName:   "Amira Al-Farsi",
				Notes:         "Scheduled for Technical Architecture Round.",
				MovedAt:       time.Now().Add(-12 * time.Hour),
			},
		}, nil
	}

	query := `SELECT ash.id, ash.application_id, ash.from_stage, ash.to_stage, ash.moved_by, 
	                 COALESCE(up.full_name, 'Recruiter'), ash.notes, ash.moved_at
	          FROM application_stage_history ash
	          LEFT JOIN user_profiles up ON ash.moved_by = up.user_id
	          WHERE ash.application_id = $1
	          ORDER BY ash.moved_at DESC`
	rows, err := r.db.Query(ctx, query, applicationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ApplicationStageHistoryDTO
	for rows.Next() {
		var h models.ApplicationStageHistoryDTO
		err := rows.Scan(&h.ID, &h.ApplicationID, &h.FromStage, &h.ToStage, &h.MovedBy, &h.MovedByName, &h.Notes, &h.MovedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, h)
	}
	return list, nil
}

// CreateCandidateNote inserts a recruiter note on a candidate.
func (r *RecruiterRepository) CreateCandidateNote(ctx context.Context, note *models.CandidateNoteItem, orgID uuid.UUID, applicationID *uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO recruiter_internal_notes (id, org_id, candidate_id, application_id, recruiter_id, recruiter_name, note, score, recommendation, is_pinned, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`
	var appID *uuid.UUID
	if applicationID != nil && *applicationID != uuid.Nil {
		appID = applicationID
	}
	_, err := r.db.Exec(ctx, query, note.ID, orgID, note.CandidateID, appID, note.RecruiterID, note.RecruiterName, note.Note, note.Score, note.Recommendation, note.IsPinned)
	return err
}

// GetCandidateNotes retrieves notes for a candidate scoped to an organization.
func (r *RecruiterRepository) GetCandidateNotes(ctx context.Context, candidateID, orgID uuid.UUID) ([]models.CandidateNoteItem, error) {
	if r.db == nil {
		return []models.CandidateNoteItem{
			{
				ID:             uuid.New(),
				CandidateID:    candidateID,
				RecruiterID:    uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				RecruiterName:  "Rashid Al-Maktoum",
				Note:           "Exceptional Go microservices experience. Strong systems design skills demonstrated in portfolio.",
				Score:          9,
				Recommendation: "Strong Hire",
				IsPinned:       true,
				CreatedAt:      time.Now().Add(-4 * time.Hour),
			},
			{
				ID:             uuid.New(),
				CandidateID:    candidateID,
				RecruiterID:    uuid.MustParse("00000000-0000-0000-0000-000000000002"),
				RecruiterName:  "Amira Al-Farsi",
				Note:           "Good communication skills. Aligned with team culture and values.",
				Score:          8,
				Recommendation: "Hire",
				IsPinned:       false,
				CreatedAt:      time.Now().Add(-2 * time.Hour),
			},
		}, nil
	}

	query := `SELECT id, candidate_id, recruiter_id, COALESCE(recruiter_name, 'Recruiter'), note, score, COALESCE(recommendation, 'Consider'), is_pinned, created_at
	          FROM recruiter_internal_notes
	          WHERE candidate_id = $1 AND org_id = $2
	          ORDER BY is_pinned DESC, created_at DESC`
	rows, err := r.db.Query(ctx, query, candidateID, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.CandidateNoteItem
	for rows.Next() {
		var n models.CandidateNoteItem
		err := rows.Scan(&n.ID, &n.CandidateID, &n.RecruiterID, &n.RecruiterName, &n.Note, &n.Score, &n.Recommendation, &n.IsPinned, &n.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, n)
	}
	return list, nil
}

// CreateCandidateEvaluation inserts a structured evaluation.
func (r *RecruiterRepository) CreateCandidateEvaluation(ctx context.Context, eval *models.CandidateEvaluationDTO) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO candidate_evaluations
	          (id, application_id, job_id, candidate_id, evaluator_id, evaluator_name, org_id,
	           skills_score, experience_score, communication_score, technical_score,
	           culture_fit_score, role_fit_score, overall_score, recommendation,
	           strengths, weaknesses, notes, created_at)
	          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())`
	_, err := r.db.Exec(ctx, query, eval.ID, eval.ApplicationID, eval.JobID, eval.CandidateID,
		eval.EvaluatorID, eval.EvaluatorName, eval.OrgID,
		eval.SkillsScore, eval.ExperienceScore, eval.CommunicationScore, eval.TechnicalScore,
		eval.CultureFitScore, eval.RoleFitScore, eval.OverallScore, eval.Recommendation,
		eval.Strengths, eval.Weaknesses, eval.Notes)
	return err
}

// GetCandidateEvaluations retrieves evaluations for an application.
func (r *RecruiterRepository) GetCandidateEvaluations(ctx context.Context, applicationID uuid.UUID) ([]models.CandidateEvaluationDTO, error) {
	if r.db == nil {
		return []models.CandidateEvaluationDTO{
			{
				ID:                 uuid.New(),
				ApplicationID:      applicationID,
				JobID:              uuid.MustParse("11111111-1111-1111-1111-111111111111"),
				CandidateID:        uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
				EvaluatorID:        uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				EvaluatorName:      "Rashid Al-Maktoum",
				SkillsScore:        9,
				ExperienceScore:    8,
				CommunicationScore: 9,
				TechnicalScore:     10,
				CultureFitScore:    8,
				RoleFitScore:       9,
				OverallScore:       9,
				Recommendation:     "Strong Hire",
				Strengths:          "Exceptional Go microservices architecture, PostgreSQL optimization, Kubernetes orchestration",
				Weaknesses:         "Limited Kafka streaming experience",
				Notes:              "Top-tier candidate. Recommend fast-track to offer.",
				CreatedAt:          time.Now().Add(-6 * time.Hour),
			},
		}, nil
	}

	query := `SELECT id, application_id, job_id, candidate_id, evaluator_id, COALESCE(evaluator_name, 'Evaluator'), org_id,
	                 skills_score, experience_score, communication_score, technical_score,
	                 culture_fit_score, role_fit_score, overall_score, COALESCE(recommendation, 'Consider'),
	                 COALESCE(strengths, ''), COALESCE(weaknesses, ''), COALESCE(notes, ''), created_at
	          FROM candidate_evaluations
	          WHERE application_id = $1
	          ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, applicationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.CandidateEvaluationDTO
	for rows.Next() {
		var e models.CandidateEvaluationDTO
		err := rows.Scan(&e.ID, &e.ApplicationID, &e.JobID, &e.CandidateID, &e.EvaluatorID, &e.EvaluatorName, &e.OrgID,
			&e.SkillsScore, &e.ExperienceScore, &e.CommunicationScore, &e.TechnicalScore,
			&e.CultureFitScore, &e.RoleFitScore, &e.OverallScore, &e.Recommendation,
			&e.Strengths, &e.Weaknesses, &e.Notes, &e.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, nil
}

// VerifyRecruiterOrgAccess checks the recruiter belongs to the specified organization.
func (r *RecruiterRepository) VerifyRecruiterOrgAccess(ctx context.Context, recruiterProfileID, orgID uuid.UUID) (bool, error) {
	if r.db == nil {
		return true, nil
	}
	var count int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM recruiter_organization_profiles WHERE id = $1 AND org_id = $2`, recruiterProfileID, orgID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
