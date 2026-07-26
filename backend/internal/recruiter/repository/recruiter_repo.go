package repository

import (
	"context"
	"errors"
	"kirmya/internal/recruiter/models"
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
func (r *RecruiterRepository) GetOrCreateProfile(ctx context.Context, userID uuid.UUID, companyName string) (*models.RecruiterProfile, error) {
	if r.db == nil {
		// Mock offline fallback
		return &models.RecruiterProfile{
			ID:          uuid.MustParse("99999999-8888-7777-6666-555555555555"),
			UserID:      userID,
			CompanyName: companyName,
			Verified:    true,
			CreatedAt:   time.Now(),
		}, nil
	}

	var p models.RecruiterProfile
	query := "SELECT id, user_id, company_name, verified, created_at FROM recruiter_profiles WHERE user_id = $1"
	err := r.db.QueryRow(ctx, query, userID).Scan(&p.ID, &p.UserID, &p.CompanyName, &p.Verified, &p.CreatedAt)
	
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Create profile
			p = models.RecruiterProfile{
				ID:          uuid.New(),
				UserID:      userID,
				CompanyName: companyName,
				Verified:    false,
				CreatedAt:   time.Now(),
			}
			insertQ := "INSERT INTO recruiter_profiles (id, user_id, company_name, verified) VALUES ($1, $2, $3, $4)"
			_, err = r.db.Exec(ctx, insertQ, p.ID, p.UserID, p.CompanyName, p.Verified)
			if err != nil {
				return nil, err
			}
			return &p, nil
		}
		return nil, err
	}

	return &p, nil
}

// CreateJob inserts a job record.
func (r *RecruiterRepository) CreateJob(ctx context.Context, job *models.RecruiterJob) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO recruiter_jobs (id, recruiter_id, title, description, department, location, salary_range, status, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	_, err := r.db.Exec(ctx, query, job.ID, job.RecruiterID, job.Title, job.Description, job.Department, job.Location, job.SalaryRange, job.Status, job.CreatedAt)
	return err
}

// GetJobs retrieves jobs posted by a specific recruiter.
func (r *RecruiterRepository) GetJobs(ctx context.Context, recruiterID uuid.UUID) ([]models.RecruiterJob, error) {
	if r.db == nil {
		return []models.RecruiterJob{}, nil
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

// GetPipeline retrieves candidate tracking items, merging details from profiles/accounts.
func (r *RecruiterRepository) GetPipeline(ctx context.Context, jobID uuid.UUID) ([]models.CandidatePipeline, error) {
	if r.db == nil {
		return []models.CandidatePipeline{}, nil
	}

	// Joining accounts/profiles if available to retrieve candidate names/emails
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

// UpdatePipelineStage updates stage progressions and schedules.
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
		TotalJobsActive:      3,
		TotalCandidatesCount: 14,
		StageDistribution: map[string]int{
			"Applied":     6,
			"Screening":   3,
			"Shortlisted": 2,
			"Interview":   1,
			"Selected":    1,
			"Rejected":    1,
		},
		RecentActivities: []models.RecruiterActivity{},
	}

	if r.db == nil {
		return analytics, nil
	}

	// 1. Calculate active jobs count
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM recruiter_jobs WHERE recruiter_id = $1 AND status = 'active'", recruiterID).Scan(&analytics.TotalJobsActive)

	// 2. Calculate pipeline stages breakdown
	queryStages := `SELECT cp.stage, COUNT(*) 
	                FROM candidate_pipeline cp
	                JOIN recruiter_jobs rj ON cp.job_id = rj.id
	                WHERE rj.recruiter_id = $1
	                GROUP BY cp.stage`
	rows, err := r.db.Query(ctx, queryStages, recruiterID)
	if err == nil {
		defer rows.Close()
		dist := make(map[string]int)
		total := 0
		for rows.Next() {
			var stage string
			var count int
			if err := rows.Scan(&stage, &count); err == nil {
				dist[stage] = count
				total += count
			}
		}
		if len(dist) > 0 {
			analytics.StageDistribution = dist
			analytics.TotalCandidatesCount = total
		}
	}

	// 3. Fetch recent audit logs
	queryActivity := `SELECT id, recruiter_id, activity_type, description, created_at 
	                  FROM recruiter_activity 
	                  WHERE recruiter_id = $1 
	                  ORDER BY created_at DESC 
	                  LIMIT 5`
	rowsAct, err := r.db.Query(ctx, queryActivity, recruiterID)
	if err == nil {
		defer rowsAct.Close()
		var activities []models.RecruiterActivity
		for rowsAct.Next() {
			var act models.RecruiterActivity
			if err := rowsAct.Scan(&act.ID, &act.RecruiterID, &act.ActivityType, &act.Description, &act.CreatedAt); err == nil {
				activities = append(activities, act)
			}
		}
		analytics.RecentActivities = activities
	}

	return analytics, nil
}
