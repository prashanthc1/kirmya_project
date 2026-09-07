package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"kirmya/internal/applications/models"
)

type ApplicationsRepository struct {
	db *pgxpool.Pool

	// In-memory test store when db is nil
	mu       sync.RWMutex
	memApps  map[string]*models.ApplicationDetail
	memSaves map[string]*models.SavedJobDTO
	memIdem  map[string]uuid.UUID
	memCand  map[string]uuid.UUID
}

func NewApplicationsRepository(db *pgxpool.Pool) *ApplicationsRepository {
	return &ApplicationsRepository{
		db:       db,
		memApps:  make(map[string]*models.ApplicationDetail),
		memSaves: make(map[string]*models.SavedJobDTO),
		memIdem:  make(map[string]uuid.UUID),
		memCand:  make(map[string]uuid.UUID),
	}
}

func (r *ApplicationsRepository) CreateApplication(ctx context.Context, candidateID uuid.UUID, payload models.CreateApplicationPayload) (*models.ApplicationDetail, error) {
	appID := uuid.New()
	now := time.Now().UTC()

	if r.db != nil {
		tx, err := r.db.Begin(ctx)
		if err != nil {
			return nil, err
		}
		defer tx.Rollback(ctx)

		// 1. Idempotency Check
		if payload.IdempotencyKey != "" {
			var existingID uuid.UUID
			err := tx.QueryRow(ctx, `SELECT id FROM job_applications WHERE idempotency_key = $1 AND candidate_id = $2`, payload.IdempotencyKey, candidateID).Scan(&existingID)
			if err == nil && existingID != uuid.Nil {
				_ = tx.Commit(ctx)
				return r.GetApplicationByID(ctx, candidateID, existingID)
			}
		}

		// 2. Check if job exists, is active/published, and unexpired
		var jobStatus string
		var expiresAt *time.Time
		var screeningRaw []byte
		jobCheckQuery := `SELECT status, expires_at, COALESCE(screening_questions,'[]'::jsonb) FROM jobs WHERE id = $1 FOR SHARE`
		if err := tx.QueryRow(ctx, jobCheckQuery, payload.JobID).Scan(&jobStatus, &expiresAt, &screeningRaw); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, errors.New("job posting not found")
			}
			return nil, err
		}
		if jobStatus != "active" && jobStatus != "published" {
			return nil, fmt.Errorf("job is no longer accepting applications (status: %s)", jobStatus)
		}
		if expiresAt != nil && expiresAt.Before(now) {
			return nil, errors.New("job posting has expired")
		}
		var screening []struct {
			ID       string `json:"id"`
			Text     string `json:"text"`
			Required bool   `json:"required"`
		}
		if err := json.Unmarshal(screeningRaw, &screening); err != nil {
			return nil, fmt.Errorf("invalid job screening configuration: %w", err)
		}
		answerByID := make(map[string]string, len(payload.Answers))
		for _, answer := range payload.Answers {
			answerByID[answer.QuestionID] = answer.Answer
		}
		for _, question := range screening {
			if question.Required && answerByID[question.ID] == "" {
				return nil, fmt.Errorf("required screening answer missing: %s", question.ID)
			}
		}

		var resumeTitle, resumeHash string
		if payload.ResumeID != nil {
			err := tx.QueryRow(ctx, `SELECT title,COALESCE(sha256,'') FROM candidate_documents WHERE id=$1 AND candidate_id=$2 AND deleted_at IS NULL AND scan_status='clean' AND content IS NOT NULL`, *payload.ResumeID, candidateID).Scan(&resumeTitle, &resumeHash)
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, errors.New("resume attachment is missing, foreign, deleted, or not scan-clean")
			}
			if err != nil {
				return nil, err
			}
			payload.ResumeURL = "/api/v1/documents/" + payload.ResumeID.String() + "/download"
		}
		if payload.ResumeID == nil && payload.ResumeURL != "" {
			return nil, errors.New("external resume URLs are not accepted; upload an owned document")
		}
		if payload.ContactEmail == "" || payload.ContactName == "" {
			var first, last, email string
			if err := tx.QueryRow(ctx, `SELECT first_name,last_name,email FROM users WHERE id=$1`, candidateID).Scan(&first, &last, &email); err != nil {
				return nil, err
			}
			if payload.ContactName == "" {
				payload.ContactName = first + " " + last
			}
			if payload.ContactEmail == "" {
				payload.ContactEmail = email
			}
		}

		// 3. Check if candidate already applied
		var alreadyApplied bool
		checkQuery := `SELECT EXISTS(SELECT 1 FROM job_applications WHERE job_id = $1 AND candidate_id = $2)`
		if err := tx.QueryRow(ctx, checkQuery, payload.JobID, candidateID).Scan(&alreadyApplied); err != nil {
			return nil, err
		}
		if alreadyApplied {
			return nil, errors.New("candidate has already applied to this job")
		}

		answersJSON, _ := json.Marshal(payload.Answers)
		if len(payload.Answers) == 0 {
			answersJSON = []byte("[]")
		}
		source := payload.Source
		if source == "" {
			source = "Direct"
		}

		insertQuery := `
			INSERT INTO job_applications (
				id, job_id, candidate_id, current_stage, rating, applied_at, updated_at,
				resume_id, resume_url, cover_letter, answers, source, idempotency_key,
				contact_name,contact_email,contact_phone,resume_title,resume_sha256
			)
			VALUES ($1, $2, $3, 'Applied', 5, $4, $4, $5, $6, $7, $8, $9, $10,$11,$12,$13,$14,$15)
		`
		if _, err := tx.Exec(ctx, insertQuery,
			appID, payload.JobID, candidateID, now,
			payload.ResumeID, payload.ResumeURL, payload.CoverLetter, answersJSON, source, payload.IdempotencyKey,
			payload.ContactName, payload.ContactEmail, payload.ContactPhone, resumeTitle, resumeHash,
		); err != nil {
			return nil, err
		}

		// 4. Record initial stage history
		stageID := uuid.New()
		stageHistoryQuery := `
			INSERT INTO application_stage_history (id, application_id, from_stage, to_stage, moved_by, notes, moved_at)
			VALUES ($1, $2, 'None', 'Applied', $3, 'Application submitted online', $4)
		`
		if _, err := tx.Exec(ctx, stageHistoryQuery, stageID, appID, candidateID, now); err != nil {
			return nil, err
		}

		// 5. Atomically increment application count on job
		_, _ = tx.Exec(ctx, `UPDATE jobs SET applications_count = applications_count + 1 WHERE id = $1`, payload.JobID)

		if err := tx.Commit(ctx); err != nil {
			return nil, err
		}

		return r.GetApplicationByID(ctx, candidateID, appID)
	}

	// In-memory fallback for test harnesses without DB pool
	r.mu.Lock()
	defer r.mu.Unlock()

	// 1. Idempotency Check
	if payload.IdempotencyKey != "" {
		if existingID, ok := r.memIdem[candidateID.String()+":"+payload.IdempotencyKey]; ok {
			if existingApp, exists := r.memApps[existingID.String()]; exists {
				return existingApp, nil
			}
		}
	}

	// 2. Duplicate Check
	for appKey, a := range r.memApps {
		if a.Summary.JobID == payload.JobID && r.memCand[appKey] == candidateID {
			return nil, errors.New("candidate has already applied to this job")
		}
	}

	app := &models.ApplicationDetail{
		Summary: models.ApplicationSummary{
			ID:             appID,
			JobID:          payload.JobID,
			JobTitle:       "Software Engineer",
			CompanyName:    "Enterprise Systems",
			CurrentStatus:  models.StageApplied,
			AppliedAt:      now,
			LastUpdate:     now,
			ResumeURL:      payload.ResumeURL,
			EmploymentType: "Full-time",
		},
		CoverLetterText: payload.CoverLetter,
		Answers:         payload.Answers,
		Timeline: []models.ApplicationTimelineItem{
			{
				ID:          uuid.New(),
				Status:      "Applied",
				Title:       "Application Submitted",
				Description: "Application submitted online",
				Date:        now,
				MovedBy:     candidateID.String(),
			},
		},
	}
	r.memApps[appID.String()] = app
	r.memCand[appID.String()] = candidateID
	if payload.IdempotencyKey != "" {
		r.memIdem[candidateID.String()+":"+payload.IdempotencyKey] = appID
	}
	return app, nil
}

func (r *ApplicationsRepository) GetCandidateApplications(ctx context.Context, candidateID uuid.UUID, status string, search string) ([]models.ApplicationSummary, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var res []models.ApplicationSummary
		for appKey, a := range r.memApps {
			if r.memCand[appKey] != candidateID {
				continue
			}
			if status != "" && string(a.Summary.CurrentStatus) != status {
				continue
			}
			res = append(res, a.Summary)
		}
		return res, nil
	}

	query := `
		SELECT 
			a.id, a.job_id, COALESCE(j.title, 'Job Position'),
			COALESCE(j.company_id, '00000000-0000-0000-0000-000000000001'::uuid),
			COALESCE(c.name, 'Company'), COALESCE(cp.logo_url, '/images/companies/default.png'),
			COALESCE(j.location, 'Remote'), COALESCE(j.employment_type, 'Full-time'),
			COALESCE(j.salary_range, ''), a.current_stage,
			a.applied_at, a.updated_at, a.recruiter_id,
			EXISTS(SELECT 1 FROM saved_jobs sj WHERE sj.candidate_id = a.candidate_id AND sj.job_id = a.job_id) AS is_saved,
			COALESCE(a.resume_url, '')
		FROM job_applications a
		LEFT JOIN jobs j ON a.job_id = j.id
		LEFT JOIN companies c ON j.company_id = c.id
		LEFT JOIN company_profiles cp ON cp.company_id = c.id
		WHERE a.candidate_id = $1
	`
	args := []interface{}{candidateID}

	if status != "" {
		args = append(args, status)
		query += fmt.Sprintf(" AND a.current_stage = $%d", len(args))
	}
	if search != "" {
		args = append(args, "%"+search+"%")
		query += fmt.Sprintf(" AND (j.title ILIKE $%d OR c.name ILIKE $%d OR j.location ILIKE $%d)", len(args), len(args), len(args))
	}

	query += " ORDER BY a.updated_at DESC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	apps := make([]models.ApplicationSummary, 0)
	for rows.Next() {
		var app models.ApplicationSummary
		var recID *uuid.UUID
		err := rows.Scan(
			&app.ID, &app.JobID, &app.JobTitle,
			&app.CompanyID, &app.CompanyName, &app.CompanyLogo,
			&app.Location, &app.EmploymentType, &app.SalaryRange,
			&app.CurrentStatus, &app.AppliedAt, &app.LastUpdate,
			&recID, &app.IsSaved, &app.ResumeURL,
		)
		if err != nil {
			return nil, fmt.Errorf("scan application summary row: %w", err)
		}
		app.RecruiterID = recID
		apps = append(apps, app)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate candidate applications: %w", err)
	}

	return apps, nil
}

func (r *ApplicationsRepository) GetApplicationByID(ctx context.Context, candidateID, appID uuid.UUID) (*models.ApplicationDetail, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if a, ok := r.memApps[appID.String()]; ok {
			return a, nil
		}
		return nil, errors.New("application not found")
	}

	var detail models.ApplicationDetail
	var recID *uuid.UUID
	var resumeID *uuid.UUID
	var answersRaw []byte
	var coverLetter, resumeURL, resumeTitle, resumeHash string

	query := `
		SELECT 
			a.id, a.job_id, COALESCE(j.title, 'Job Position'),
			COALESCE(j.company_id, '00000000-0000-0000-0000-000000000001'::uuid),
			COALESCE(c.name, 'Company'), COALESCE(cp.logo_url, '/images/companies/default.png'),
			COALESCE(j.location, 'Remote'), COALESCE(j.employment_type, 'Full-time'),
			COALESCE(j.salary_range, ''), a.current_stage,
			a.applied_at, a.updated_at, a.recruiter_id,
			COALESCE(j.description, ''),
			COALESCE(a.cover_letter, ''),
			COALESCE(a.resume_url, ''),
			COALESCE(a.answers, '[]'::jsonb),
			a.resume_id,COALESCE(a.resume_title,''),COALESCE(a.resume_sha256,''),
			COALESCE(a.contact_name,''),COALESCE(a.contact_email,''),COALESCE(a.contact_phone,''),
			EXISTS(SELECT 1 FROM saved_jobs sj WHERE sj.candidate_id = a.candidate_id AND sj.job_id = a.job_id) AS is_saved
		FROM job_applications a
		LEFT JOIN jobs j ON a.job_id = j.id
		LEFT JOIN companies c ON j.company_id = c.id
		LEFT JOIN company_profiles cp ON cp.company_id = c.id
		WHERE a.id = $1 AND a.candidate_id = $2
	`

	err := r.db.QueryRow(ctx, query, appID, candidateID).Scan(
		&detail.Summary.ID, &detail.Summary.JobID, &detail.Summary.JobTitle,
		&detail.Summary.CompanyID, &detail.Summary.CompanyName, &detail.Summary.CompanyLogo,
		&detail.Summary.Location, &detail.Summary.EmploymentType, &detail.Summary.SalaryRange,
		&detail.Summary.CurrentStatus, &detail.Summary.AppliedAt, &detail.Summary.LastUpdate,
		&recID, &detail.JobDescription,
		&coverLetter, &resumeURL, &answersRaw, &resumeID, &resumeTitle, &resumeHash,
		&detail.ContactName, &detail.ContactEmail, &detail.ContactPhone, &detail.Summary.IsSaved,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("application not found")
		}
		return nil, err
	}

	detail.Summary.RecruiterID = recID
	detail.Summary.ResumeURL = resumeURL
	detail.CoverLetterText = coverLetter
	if resumeID != nil {
		detail.SubmittedResume = &models.CandidateDocument{ID: *resumeID, CandidateID: candidateID, Title: resumeTitle, DocumentType: "Resume", FileURL: resumeURL, SHA256: resumeHash, ScanStatus: "clean"}
	}
	if len(answersRaw) > 0 {
		_ = json.Unmarshal(answersRaw, &detail.Answers)
	}
	detail.Requirements = []string{}
	detail.Skills = []string{}

	// A failure loading any related collection is a failure of the whole read.
	// These previously degraded to empty slices, so a detail page could render
	// "no timeline, no notes, no interviews" for an application that had all
	// three.
	if detail.Timeline, err = r.GetApplicationTimeline(ctx, candidateID, appID); err != nil {
		return nil, err
	}
	if detail.Notes, err = r.GetApplicationNotes(ctx, candidateID, appID); err != nil {
		return nil, err
	}
	if detail.Interviews, err = r.GetApplicationInterviews(ctx, candidateID, appID); err != nil {
		return nil, err
	}

	return &detail, nil
}

func (r *ApplicationsRepository) WithdrawApplication(ctx context.Context, candidateID, appID uuid.UUID) error {
	now := time.Now().UTC()

	if r.db == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		if a, ok := r.memApps[appID.String()]; ok {
			if err := models.ValidateTransition(a.Summary.CurrentStatus, models.StageWithdrawn, true); err != nil {
				return err
			}
			a.Summary.CurrentStatus = models.StageWithdrawn
			a.Summary.LastUpdate = now
			return nil
		}
		return errors.New("application not found")
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var currentStage string
	if err := tx.QueryRow(ctx, `SELECT current_stage FROM job_applications WHERE id = $1 AND candidate_id = $2 FOR UPDATE`, appID, candidateID).Scan(&currentStage); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errors.New("application not found")
		}
		return err
	}

	// Validate state machine
	if err := models.ValidateTransition(models.ApplicationStage(currentStage), models.StageWithdrawn, true); err != nil {
		return err
	}

	query := `UPDATE job_applications SET current_stage = 'Withdrawn', withdrawn_at = $1, updated_at = $1 WHERE id = $2 AND candidate_id = $3`
	if _, err := tx.Exec(ctx, query, now, appID, candidateID); err != nil {
		return err
	}

	stageHistoryQuery := `
		INSERT INTO application_stage_history (id, application_id, from_stage, to_stage, moved_by, notes, moved_at)
		VALUES ($1, $2, $3, 'Withdrawn', $4, 'Candidate withdrew application', $5)
	`
	if _, err := tx.Exec(ctx, stageHistoryQuery, uuid.New(), appID, currentStage, candidateID, now); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *ApplicationsRepository) ArchiveApplication(ctx context.Context, candidateID, appID uuid.UUID) error {
	now := time.Now().UTC()

	if r.db == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		if a, ok := r.memApps[appID.String()]; ok {
			a.Summary.CurrentStatus = models.StageArchived
			a.Summary.LastUpdate = now
			return nil
		}
		return errors.New("application not found")
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var currentStage string
	if err := tx.QueryRow(ctx, `SELECT current_stage FROM job_applications WHERE id = $1 AND candidate_id = $2 FOR UPDATE`, appID, candidateID).Scan(&currentStage); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errors.New("application not found")
		}
		return err
	}

	query := `UPDATE job_applications SET current_stage = 'Archived', archived_at = $1, updated_at = $1 WHERE id = $2 AND candidate_id = $3`
	if _, err := tx.Exec(ctx, query, now, appID, candidateID); err != nil {
		return err
	}

	stageHistoryQuery := `
		INSERT INTO application_stage_history (id, application_id, from_stage, to_stage, moved_by, notes, moved_at)
		VALUES ($1, $2, $3, 'Archived', $4, 'Application archived by candidate', $5)
	`
	if _, err := tx.Exec(ctx, stageHistoryQuery, uuid.New(), appID, currentStage, candidateID, now); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ErrApplicationNotFound is returned for an application that does not exist and
// for one owned by a different candidate. The two cases are deliberately
// indistinguishable: telling a caller that an application exists but is not
// theirs confirms the existence of another candidate's record.
var ErrApplicationNotFound = errors.New("application not found")

// GetApplicationTimeline returns the stage history of one application owned by
// candidateID.
//
// The candidate is part of the query rather than a check performed afterwards.
// This previously selected on application_id alone, so any authenticated caller
// who knew or guessed an application UUID could read another candidate's hiring
// progress. It also returned an empty slice when the query failed, which is why
// a database outage looked to the UI exactly like an application with no
// history.
func (r *ApplicationsRepository) GetApplicationTimeline(ctx context.Context, candidateID, appID uuid.UUID) ([]models.ApplicationTimelineItem, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		a, ok := r.memApps[appID.String()]
		if !ok || r.memCand[appID.String()] != candidateID {
			return nil, ErrApplicationNotFound
		}
		return append([]models.ApplicationTimelineItem{}, a.Timeline...), nil
	}

	// Ownership is established first and separately so that a foreign or
	// unknown application is a not-found rather than an empty timeline.
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM job_applications WHERE id = $1 AND candidate_id = $2)`,
		appID, candidateID).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("verify application ownership: %w", err)
	}
	if !exists {
		return nil, ErrApplicationNotFound
	}

	query := `
		SELECT h.id, h.to_stage, h.from_stage, COALESCE(h.notes, ''), h.moved_at, COALESCE(h.moved_by::text, 'System')
		FROM application_stage_history h
		JOIN job_applications a ON a.id = h.application_id
		WHERE h.application_id = $1 AND a.candidate_id = $2
		ORDER BY h.moved_at ASC
	`
	rows, err := r.db.Query(ctx, query, appID, candidateID)
	if err != nil {
		return nil, fmt.Errorf("query application timeline: %w", err)
	}
	defer rows.Close()

	items := make([]models.ApplicationTimelineItem, 0)
	for rows.Next() {
		var item models.ApplicationTimelineItem
		var fromStage, movedBy string
		if err := rows.Scan(&item.ID, &item.Status, &fromStage, &item.Description, &item.Date, &movedBy); err != nil {
			return nil, fmt.Errorf("scan application timeline row: %w", err)
		}
		item.Title = fmt.Sprintf("Stage changed to %s", item.Status)
		item.MovedBy = movedBy
		items = append(items, item)
	}
	// A driver-level failure part way through iteration surfaces only here.
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate application timeline: %w", err)
	}

	return items, nil
}

func (r *ApplicationsRepository) SaveJob(ctx context.Context, candidateID, jobID uuid.UUID, notes string) error {
	if r.db == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.memSaves[candidateID.String()+":"+jobID.String()] = &models.SavedJobDTO{
			ID:          uuid.New(),
			CandidateID: candidateID,
			JobID:       jobID,
			JobTitle:    "Saved Job",
			Notes:       notes,
			SavedAt:     time.Now(),
			IsActive:    true,
		}
		return nil
	}

	query := `
		INSERT INTO saved_jobs (id, candidate_id, job_id, notes, saved_at)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
		ON CONFLICT (candidate_id, job_id) DO UPDATE SET notes = EXCLUDED.notes
	`
	_, err := r.db.Exec(ctx, query, uuid.New(), candidateID, jobID, notes)
	return err
}

func (r *ApplicationsRepository) RemoveSavedJob(ctx context.Context, candidateID, jobID uuid.UUID) error {
	if r.db == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		delete(r.memSaves, candidateID.String()+":"+jobID.String())
		return nil
	}

	query := `DELETE FROM saved_jobs WHERE candidate_id = $1 AND job_id = $2`
	_, err := r.db.Exec(ctx, query, candidateID, jobID)
	return err
}

func (r *ApplicationsRepository) IsJobSaved(ctx context.Context, candidateID, jobID uuid.UUID) (bool, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		_, ok := r.memSaves[candidateID.String()+":"+jobID.String()]
		return ok, nil
	}

	var isSaved bool
	query := `SELECT EXISTS(SELECT 1 FROM saved_jobs WHERE candidate_id = $1 AND job_id = $2)`
	err := r.db.QueryRow(ctx, query, candidateID, jobID).Scan(&isSaved)
	return isSaved, err
}

func (r *ApplicationsRepository) GetSavedJobs(ctx context.Context, candidateID uuid.UUID) ([]models.SavedJobDTO, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []models.SavedJobDTO
		for _, s := range r.memSaves {
			if s.CandidateID == candidateID {
				list = append(list, *s)
			}
		}
		return list, nil
	}

	query := `
		SELECT 
			sj.id, sj.candidate_id, sj.job_id,
			COALESCE(j.title, 'Job Title'),
			COALESCE(c.name, 'Company'), COALESCE(cp.logo_url, '/images/companies/default.png'),
			COALESCE(j.location, 'Remote'), COALESCE(j.salary_range, ''),
			COALESCE(j.employment_type, 'Full-time'), sj.collection_id,
			COALESCE(sjc.name, 'General Saved'), COALESCE(sj.notes, ''), sj.saved_at,
			(j.status = 'active' OR j.status = 'published') AS is_active
		FROM saved_jobs sj
		LEFT JOIN jobs j ON sj.job_id = j.id
		LEFT JOIN companies c ON j.company_id = c.id
		LEFT JOIN company_profiles cp ON cp.company_id = c.id
		LEFT JOIN saved_job_collections sjc ON sj.collection_id = sjc.id
		WHERE sj.candidate_id = $1
		ORDER BY sj.saved_at DESC
	`

	rows, err := r.db.Query(ctx, query, candidateID)
	if err != nil {
		return nil, fmt.Errorf("query saved jobs: %w", err)
	}
	defer rows.Close()

	list := make([]models.SavedJobDTO, 0)
	for rows.Next() {
		var item models.SavedJobDTO
		err := rows.Scan(
			&item.ID, &item.CandidateID, &item.JobID,
			&item.JobTitle, &item.CompanyName, &item.CompanyLogo,
			&item.Location, &item.SalaryRange, &item.EmploymentType,
			&item.CollectionID, &item.CollectionName, &item.Notes, &item.SavedAt,
			&item.IsActive,
		)
		if err != nil {
			return nil, fmt.Errorf("scan saved job row: %w", err)
		}
		list = append(list, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate saved jobs: %w", err)
	}

	return list, nil
}

func (r *ApplicationsRepository) GetJobAlerts(ctx context.Context, candidateID uuid.UUID) ([]models.JobAlertDTO, error) {
	if r.db == nil {
		return []models.JobAlertDTO{}, nil
	}

	query := `
		SELECT id, candidate_id, title, COALESCE(keywords, ''), job_titles, skills,
		       COALESCE(location, ''), COALESCE(industry, ''), salary_min, salary_max,
		       employment_type, frequency, channel_email, channel_push, channel_in_app, is_active, created_at, updated_at
		FROM job_alerts
		WHERE candidate_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, candidateID)
	if err != nil {
		return nil, fmt.Errorf("query job alerts: %w", err)
	}
	defer rows.Close()

	alerts := make([]models.JobAlertDTO, 0)
	for rows.Next() {
		var alert models.JobAlertDTO
		err := rows.Scan(
			&alert.ID, &alert.CandidateID, &alert.Title, &alert.Keywords, &alert.JobTitles, &alert.Skills,
			&alert.Location, &alert.Industry, &alert.SalaryMin, &alert.SalaryMax,
			&alert.EmploymentType, &alert.Frequency, &alert.ChannelEmail, &alert.ChannelPush, &alert.ChannelInApp,
			&alert.IsActive, &alert.CreatedAt, &alert.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan job alert row: %w", err)
		}
		alerts = append(alerts, alert)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate job alerts: %w", err)
	}

	return alerts, nil
}

func (r *ApplicationsRepository) CreateJobAlert(ctx context.Context, candidateID uuid.UUID, payload models.CreateJobAlertPayload) (*models.JobAlertDTO, error) {
	alert := models.JobAlertDTO{
		ID:             uuid.New(),
		CandidateID:    candidateID,
		Title:          payload.Title,
		Keywords:       payload.Keywords,
		JobTitles:      payload.JobTitles,
		Skills:         payload.Skills,
		Location:       payload.Location,
		Industry:       payload.Industry,
		SalaryMin:      payload.SalaryMin,
		SalaryMax:      payload.SalaryMax,
		EmploymentType: payload.EmploymentType,
		Frequency:      payload.Frequency,
		ChannelEmail:   payload.ChannelEmail,
		ChannelPush:    payload.ChannelPush,
		ChannelInApp:   payload.ChannelInApp,
		IsActive:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if r.db == nil {
		return &alert, nil
	}

	query := `
		INSERT INTO job_alerts (
			id, candidate_id, title, keywords, job_titles, skills, location, industry,
			salary_min, salary_max, employment_type, frequency, channel_email, channel_push, channel_in_app, is_active
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)
	`
	_, err := r.db.Exec(ctx, query,
		alert.ID, alert.CandidateID, alert.Title, alert.Keywords, alert.JobTitles, alert.Skills, alert.Location, alert.Industry,
		alert.SalaryMin, alert.SalaryMax, alert.EmploymentType, alert.Frequency, alert.ChannelEmail, alert.ChannelPush, alert.ChannelInApp,
	)
	if err != nil {
		return &alert, nil
	}
	return &alert, nil
}

func (r *ApplicationsRepository) DeleteJobAlert(ctx context.Context, candidateID, alertID uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, `DELETE FROM job_alerts WHERE id = $1 AND candidate_id = $2`, alertID, candidateID)
	return err
}

func (r *ApplicationsRepository) GetCandidateInterviews(ctx context.Context, candidateID uuid.UUID) ([]models.CandidateInterview, error) {
	if r.db == nil {
		return []models.CandidateInterview{}, nil
	}

	query := `
		SELECT 
			i.id, COALESCE(i.job_id, '00000000-0000-0000-0000-000000000001'::uuid),
			COALESCE(j.title, 'Interview'), COALESCE(c.name, 'Company'),
			COALESCE(cp.logo_url, '/images/companies/default.png'), i.title,
			i.status, i.scheduled_start, i.scheduled_end,
			COALESCE(i.location_type, 'virtual'), COALESCE(i.meeting_link, ''),
			COALESCE(i.notes, '')
		FROM interviews i
		LEFT JOIN jobs j ON i.job_id = j.id
		LEFT JOIN companies c ON j.company_id = c.id
		LEFT JOIN company_profiles cp ON cp.company_id = c.id
		WHERE i.candidate_id = $1
		ORDER BY i.scheduled_start ASC
	`
	rows, err := r.db.Query(ctx, query, candidateID)
	if err != nil {
		return nil, fmt.Errorf("query candidate interviews: %w", err)
	}
	defer rows.Close()

	list := make([]models.CandidateInterview, 0)
	for rows.Next() {
		var item models.CandidateInterview
		err := rows.Scan(
			&item.ID, &item.ApplicationID, &item.JobTitle, &item.CompanyName,
			&item.CompanyLogo, &item.Title, &item.Status, &item.ScheduledStart, &item.ScheduledEnd,
			&item.LocationType, &item.MeetingLink, &item.Notes,
		)
		if err != nil {
			return nil, fmt.Errorf("scan candidate interview row: %w", err)
		}
		list = append(list, item)
	}

	return list, nil
}

func (r *ApplicationsRepository) GetCandidateDocuments(ctx context.Context, candidateID uuid.UUID) ([]models.CandidateDocument, error) {
	if r.db == nil {
		return []models.CandidateDocument{}, nil
	}

	query := `
		SELECT id, candidate_id, title, document_type, file_url, file_size_bytes, file_type, is_default, uploaded_at,
		       COALESCE(storage_key,''), COALESCE(sha256,''), COALESCE(scan_status,'clean'), COALESCE(original_filename,'')
		FROM candidate_documents
		WHERE candidate_id = $1 AND deleted_at IS NULL
		ORDER BY uploaded_at DESC
	`
	rows, err := r.db.Query(ctx, query, candidateID)
	if err != nil {
		return nil, fmt.Errorf("query candidate documents: %w", err)
	}
	defer rows.Close()

	docs := make([]models.CandidateDocument, 0)
	for rows.Next() {
		var doc models.CandidateDocument
		err := rows.Scan(
			&doc.ID, &doc.CandidateID, &doc.Title, &doc.DocumentType,
			&doc.FileURL, &doc.SizeBytes, &doc.FileType, &doc.IsDefault, &doc.UploadedAt,
			&doc.StorageKey, &doc.SHA256, &doc.ScanStatus, &doc.OriginalName,
		)
		if err != nil {
			return nil, fmt.Errorf("scan candidate document row: %w", err)
		}
		docs = append(docs, doc)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate candidate documents: %w", err)
	}

	return docs, nil
}

func (r *ApplicationsRepository) CreateDocument(ctx context.Context, doc *models.CandidateDocument, content []byte) error {
	if r.db == nil {
		return errors.New("document storage requires PostgreSQL")
	}
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if doc.IsDefault {
		if _, err = tx.Exec(ctx, `UPDATE candidate_documents SET is_default=false,updated_at=NOW() WHERE candidate_id=$1 AND document_type=$2 AND deleted_at IS NULL`, doc.CandidateID, doc.DocumentType); err != nil {
			return err
		}
	}
	_, err = tx.Exec(ctx, `INSERT INTO candidate_documents(id,candidate_id,title,document_type,file_url,file_size_bytes,file_type,is_default,uploaded_at,updated_at,storage_key,content,sha256,scan_status,original_filename) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11,$12,$13,$14)`, doc.ID, doc.CandidateID, doc.Title, doc.DocumentType, doc.FileURL, doc.SizeBytes, doc.FileType, doc.IsDefault, doc.UploadedAt, doc.StorageKey, content, doc.SHA256, doc.ScanStatus, doc.OriginalName)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *ApplicationsRepository) GetDocumentContent(ctx context.Context, candidateID, docID uuid.UUID) (*models.CandidateDocument, []byte, error) {
	if r.db == nil {
		return nil, nil, errors.New("document storage requires PostgreSQL")
	}
	var d models.CandidateDocument
	var content []byte
	err := r.db.QueryRow(ctx, `SELECT id,candidate_id,title,document_type,file_url,file_size_bytes,file_type,is_default,uploaded_at,COALESCE(storage_key,''),COALESCE(content,''::bytea),COALESCE(sha256,''),COALESCE(scan_status,'clean'),COALESCE(original_filename,'') FROM candidate_documents WHERE id=$1 AND candidate_id=$2 AND deleted_at IS NULL`, docID, candidateID).Scan(&d.ID, &d.CandidateID, &d.Title, &d.DocumentType, &d.FileURL, &d.SizeBytes, &d.FileType, &d.IsDefault, &d.UploadedAt, &d.StorageKey, &content, &d.SHA256, &d.ScanStatus, &d.OriginalName)
	if err != nil {
		return nil, nil, err
	}
	return &d, content, nil
}

func (r *ApplicationsRepository) DeleteDocument(ctx context.Context, candidateID, docID uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	res, err := r.db.Exec(ctx, `UPDATE candidate_documents SET content=NULL,deleted_at=NOW(),updated_at=NOW() WHERE id=$1 AND candidate_id=$2 AND deleted_at IS NULL`, docID, candidateID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("document not found")
	}
	return nil
}

// GetApplicationNotes returns the candidate's private notes on one application.
// Notes are scoped by candidate in the query, so a foreign application yields
// no rows rather than another candidate's notes.
func (r *ApplicationsRepository) GetApplicationNotes(ctx context.Context, candidateID, appID uuid.UUID) ([]models.ApplicationNote, error) {
	if r.db == nil {
		return []models.ApplicationNote{}, nil
	}

	query := `
		SELECT id, application_id, candidate_id, note_text, created_at, updated_at
		FROM application_notes
		WHERE application_id = $1 AND candidate_id = $2
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, appID, candidateID)
	if err != nil {
		return nil, fmt.Errorf("query application notes: %w", err)
	}
	defer rows.Close()

	notes := make([]models.ApplicationNote, 0)
	for rows.Next() {
		var n models.ApplicationNote
		if err := rows.Scan(&n.ID, &n.ApplicationID, &n.CandidateID, &n.NoteText, &n.CreatedAt, &n.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan application note row: %w", err)
		}
		notes = append(notes, n)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate application notes: %w", err)
	}
	return notes, nil
}

// GetApplicationInterviews returns interviews for one application, scoped to the
// owning candidate.
func (r *ApplicationsRepository) GetApplicationInterviews(ctx context.Context, candidateID, appID uuid.UUID) ([]models.CandidateInterview, error) {
	if r.db == nil {
		return []models.CandidateInterview{}, nil
	}

	query := `
		SELECT 
			i.id, i.application_id, COALESCE(j.title, 'Interview'),
			COALESCE(c.name, 'Company'), COALESCE(cp.logo_url, '/images/companies/default.png'),
			i.title, i.status, i.scheduled_start, i.scheduled_end,
			COALESCE(i.location_type, 'virtual'), COALESCE(i.meeting_link, ''),
			COALESCE(i.notes, '')
		FROM interviews i
		LEFT JOIN jobs j ON i.job_id = j.id
		LEFT JOIN companies c ON j.company_id = c.id
		LEFT JOIN company_profiles cp ON cp.company_id = c.id
		WHERE i.application_id = $1 AND i.candidate_id = $2
		ORDER BY i.scheduled_start ASC
	`
	rows, err := r.db.Query(ctx, query, appID, candidateID)
	if err != nil {
		return nil, fmt.Errorf("query application interviews: %w", err)
	}
	defer rows.Close()

	interviews := make([]models.CandidateInterview, 0)
	for rows.Next() {
		var item models.CandidateInterview
		if err := rows.Scan(
			&item.ID, &item.ApplicationID, &item.JobTitle, &item.CompanyName,
			&item.CompanyLogo, &item.Title, &item.Status, &item.ScheduledStart, &item.ScheduledEnd,
			&item.LocationType, &item.MeetingLink, &item.Notes,
		); err != nil {
			return nil, fmt.Errorf("scan application interview row: %w", err)
		}
		interviews = append(interviews, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate application interviews: %w", err)
	}
	return interviews, nil
}
