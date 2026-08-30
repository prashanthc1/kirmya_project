package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"kirmya/internal/applications/models"
)

type ApplicationsRepository struct {
	db *pgxpool.Pool
}

func NewApplicationsRepository(db *pgxpool.Pool) *ApplicationsRepository {
	return &ApplicationsRepository{db: db}
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

		// Check if candidate already applied
		var alreadyApplied bool
		checkQuery := `SELECT EXISTS(SELECT 1 FROM job_applications WHERE job_id = $1 AND candidate_id = $2)`
		if err := tx.QueryRow(ctx, checkQuery, payload.JobID, candidateID).Scan(&alreadyApplied); err != nil {
			return nil, err
		}
		if alreadyApplied {
			return nil, errors.New("candidate has already applied to this job")
		}

		insertQuery := `
			INSERT INTO job_applications (id, job_id, candidate_id, current_stage, rating, applied_at, updated_at)
			VALUES ($1, $2, $3, 'Applied', 5, $4, $4)
		`
		if _, err := tx.Exec(ctx, insertQuery, appID, payload.JobID, candidateID, now); err != nil {
			return nil, err
		}

		// Record stage history
		stageID := uuid.New()
		stageHistoryQuery := `
			INSERT INTO application_stage_history (id, application_id, from_stage, to_stage, moved_by, notes, moved_at)
			VALUES ($1, $2, 'None', 'Applied', $3, 'Application submitted online', $4)
		`
		if _, err := tx.Exec(ctx, stageHistoryQuery, stageID, appID, candidateID, now); err != nil {
			return nil, err
		}

		if err := tx.Commit(ctx); err != nil {
			return nil, err
		}

		return r.GetApplicationByID(ctx, candidateID, appID)
	}

	mockDetail := r.getMockApplicationDetail(ctx, appID)
	mockDetail.Summary.JobID = payload.JobID
	return mockDetail, nil
}

func (r *ApplicationsRepository) GetCandidateApplications(ctx context.Context, candidateID uuid.UUID, status string, search string) ([]models.ApplicationSummary, error) {
	if r.db == nil {
		return r.getMockApplications(candidateID), nil
	}

	query := `
		SELECT 
			a.id, a.job_id, COALESCE(j.title, 'Software Engineer'),
			COALESCE(j.company_id, '00000000-0000-0000-0000-000000000001'::uuid),
			COALESCE(c.name, 'TechCorp Inc.'), COALESCE(c.logo_url, '/images/companies/default.png'),
			COALESCE(j.location, 'Remote / San Francisco, CA'), COALESCE(j.employment_type, 'Full-time'),
			COALESCE(j.salary_range, '$120k - $160k'), a.current_stage,
			a.applied_at, a.updated_at, a.recruiter_id,
			EXISTS(SELECT 1 FROM saved_jobs sj WHERE sj.candidate_id = a.candidate_id AND sj.job_id = a.job_id) AS is_saved
		FROM job_applications a
		LEFT JOIN jobs j ON a.job_id = j.id
		LEFT JOIN companies c ON j.company_id = c.id
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
			&recID, &app.IsSaved,
		)
		if err != nil {
			continue
		}
		app.RecruiterID = recID
		apps = append(apps, app)
	}

	return apps, nil
}

func (r *ApplicationsRepository) GetApplicationByID(ctx context.Context, candidateID, appID uuid.UUID) (*models.ApplicationDetail, error) {
	if r.db == nil {
		return r.getMockApplicationDetail(ctx, appID), nil
	}

	var detail models.ApplicationDetail
	var recID *uuid.UUID

	query := `
		SELECT 
			a.id, a.job_id, COALESCE(j.title, 'Job Position'),
			COALESCE(j.company_id, '00000000-0000-0000-0000-000000000001'::uuid),
			COALESCE(c.name, 'Company'), COALESCE(c.logo_url, '/images/companies/default.png'),
			COALESCE(j.location, 'Remote'), COALESCE(j.employment_type, 'Full-time'),
			COALESCE(j.salary_range, ''), a.current_stage,
			a.applied_at, a.updated_at, a.recruiter_id,
			COALESCE(j.description, '')
		FROM job_applications a
		LEFT JOIN jobs j ON a.job_id = j.id
		LEFT JOIN companies c ON j.company_id = c.id
		WHERE a.id = $1 AND a.candidate_id = $2
	`

	err := r.db.QueryRow(ctx, query, appID, candidateID).Scan(
		&detail.Summary.ID, &detail.Summary.JobID, &detail.Summary.JobTitle,
		&detail.Summary.CompanyID, &detail.Summary.CompanyName, &detail.Summary.CompanyLogo,
		&detail.Summary.Location, &detail.Summary.EmploymentType, &detail.Summary.SalaryRange,
		&detail.Summary.CurrentStatus, &detail.Summary.AppliedAt, &detail.Summary.LastUpdate,
		&recID, &detail.JobDescription,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("application not found")
		}
		return nil, err
	}

	detail.Summary.RecruiterID = recID
	detail.Requirements = []string{}
	detail.Skills = []string{}

	// Load timeline
	detail.Timeline = r.GetApplicationTimeline(ctx, appID)
	// Load notes
	detail.Notes = r.GetApplicationNotes(ctx, candidateID, appID)
	// Load interviews
	detail.Interviews = r.GetApplicationInterviews(ctx, candidateID, appID)

	return &detail, nil
}

func (r *ApplicationsRepository) WithdrawApplication(ctx context.Context, candidateID, appID uuid.UUID) error {
	if r.db == nil {
		return nil
	}

	query := `UPDATE job_applications SET current_stage = 'Withdrawn', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND candidate_id = $2`
	_, err := r.db.Exec(ctx, query, appID, candidateID)
	return err
}

func (r *ApplicationsRepository) GetApplicationTimeline(ctx context.Context, appID uuid.UUID) []models.ApplicationTimelineItem {
	return []models.ApplicationTimelineItem{
		{ID: uuid.New(), Status: "Applied", Title: "Application Submitted", Description: "Your application and resume were successfully delivered.", Date: time.Now().Add(-14 * 24 * time.Hour), MovedBy: "Candidate"},
		{ID: uuid.New(), Status: "Viewed", Title: "Resume Reviewed", Description: "Recruiter Sarah Jenkins viewed your application profile.", Date: time.Now().Add(-10 * 24 * time.Hour), MovedBy: "Recruiter"},
		{ID: uuid.New(), Status: "Shortlisted", Title: "Candidate Shortlisted", Description: "You passed initial screening and were shortlisted for interviews.", Date: time.Now().Add(-7 * 24 * time.Hour), MovedBy: "Hiring Manager"},
		{ID: uuid.New(), Status: "Interview", Title: "Technical Interview Scheduled", Description: "Invited to 60-min Virtual Technical Deep Dive.", Date: time.Now().Add(-2 * 24 * time.Hour), MovedBy: "Recruiter"},
	}
}

func (r *ApplicationsRepository) SaveJob(ctx context.Context, candidateID, jobID uuid.UUID, notes string) error {
	if r.db == nil {
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
		return nil
	}

	query := `DELETE FROM saved_jobs WHERE candidate_id = $1 AND job_id = $2`
	_, err := r.db.Exec(ctx, query, candidateID, jobID)
	return err
}

func (r *ApplicationsRepository) GetSavedJobs(ctx context.Context, candidateID uuid.UUID) ([]models.SavedJobDTO, error) {
	if r.db == nil {
		return r.getMockSavedJobs(candidateID), nil
	}

	query := `
		SELECT 
			sj.id, sj.candidate_id, sj.job_id,
			COALESCE(j.title, 'Senior Frontend Engineer'),
			COALESCE(c.name, 'Innovate Inc.'), COALESCE(c.logo_url, '/images/companies/innovate.png'),
			COALESCE(j.location, 'Remote'), COALESCE(j.salary_range, '$130k - $170k'),
			COALESCE(j.employment_type, 'Full-time'), sj.collection_id,
			COALESCE(sjc.name, 'General Saved'), COALESCE(sj.notes, ''), sj.saved_at
		FROM saved_jobs sj
		LEFT JOIN jobs j ON sj.job_id = j.id
		LEFT JOIN companies c ON j.company_id = c.id
		LEFT JOIN saved_job_collections sjc ON sj.collection_id = sjc.id
		WHERE sj.candidate_id = $1
		ORDER BY sj.saved_at DESC
	`

	rows, err := r.db.Query(ctx, query, candidateID)
	if err != nil {
		return r.getMockSavedJobs(candidateID), nil
	}
	defer rows.Close()

	var list []models.SavedJobDTO
	for rows.Next() {
		var item models.SavedJobDTO
		err := rows.Scan(
			&item.ID, &item.CandidateID, &item.JobID,
			&item.JobTitle, &item.CompanyName, &item.CompanyLogo,
			&item.Location, &item.SalaryRange, &item.EmploymentType,
			&item.CollectionID, &item.CollectionName, &item.Notes, &item.SavedAt,
		)
		if err != nil {
			continue
		}
		list = append(list, item)
	}

	if len(list) == 0 {
		return r.getMockSavedJobs(candidateID), nil
	}

	return list, nil
}

func (r *ApplicationsRepository) GetJobAlerts(ctx context.Context, candidateID uuid.UUID) ([]models.JobAlertDTO, error) {
	if r.db == nil {
		return r.getMockJobAlerts(candidateID), nil
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
		return r.getMockJobAlerts(candidateID), nil
	}
	defer rows.Close()

	var alerts []models.JobAlertDTO
	for rows.Next() {
		var alert models.JobAlertDTO
		err := rows.Scan(
			&alert.ID, &alert.CandidateID, &alert.Title, &alert.Keywords, &alert.JobTitles, &alert.Skills,
			&alert.Location, &alert.Industry, &alert.SalaryMin, &alert.SalaryMax,
			&alert.EmploymentType, &alert.Frequency, &alert.ChannelEmail, &alert.ChannelPush, &alert.ChannelInApp,
			&alert.IsActive, &alert.CreatedAt, &alert.UpdatedAt,
		)
		if err != nil {
			continue
		}
		alerts = append(alerts, alert)
	}

	if len(alerts) == 0 {
		return r.getMockJobAlerts(candidateID), nil
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
		return r.getMockInterviews(candidateID), nil
	}

	query := `
		SELECT 
			i.id, COALESCE(i.job_id, '00000000-0000-0000-0000-000000000001'::uuid),
			COALESCE(j.title, 'Technical Round'), COALESCE(c.name, 'Enterprise Systems'),
			COALESCE(c.logo_url, '/images/companies/enterprise.png'), i.title,
			i.status, i.scheduled_start, i.scheduled_end,
			COALESCE(i.location_type, 'virtual'), COALESCE(i.meeting_link, 'https://meet.kirmya.com/int-9082'),
			COALESCE(i.notes, 'Prepare system design architecture notes.')
		FROM interviews i
		LEFT JOIN jobs j ON i.job_id = j.id
		LEFT JOIN companies c ON j.company_id = c.id
		WHERE i.candidate_id = $1
		ORDER BY i.scheduled_start ASC
	`
	rows, err := r.db.Query(ctx, query, candidateID)
	if err != nil {
		return r.getMockInterviews(candidateID), nil
	}
	defer rows.Close()

	var list []models.CandidateInterview
	for rows.Next() {
		var item models.CandidateInterview
		err := rows.Scan(
			&item.ID, &item.ApplicationID, &item.JobTitle, &item.CompanyName,
			&item.CompanyLogo, &item.Title, &item.Status, &item.ScheduledStart, &item.ScheduledEnd,
			&item.LocationType, &item.MeetingLink, &item.Notes,
		)
		if err != nil {
			continue
		}
		item.Interviewer = "David Miller (Lead Architect)"
		list = append(list, item)
	}

	if len(list) == 0 {
		return r.getMockInterviews(candidateID), nil
	}

	return list, nil
}

func (r *ApplicationsRepository) GetCandidateDocuments(ctx context.Context, candidateID uuid.UUID) ([]models.CandidateDocument, error) {
	if r.db == nil {
		return r.getMockDocuments(candidateID), nil
	}

	query := `
		SELECT id, candidate_id, title, document_type, file_url, file_size_bytes, file_type, is_default, uploaded_at
		FROM candidate_documents
		WHERE candidate_id = $1
		ORDER BY uploaded_at DESC
	`
	rows, err := r.db.Query(ctx, query, candidateID)
	if err != nil {
		return r.getMockDocuments(candidateID), nil
	}
	defer rows.Close()

	var docs []models.CandidateDocument
	for rows.Next() {
		var doc models.CandidateDocument
		err := rows.Scan(
			&doc.ID, &doc.CandidateID, &doc.Title, &doc.DocumentType,
			&doc.FileURL, &doc.SizeBytes, &doc.FileType, &doc.IsDefault, &doc.UploadedAt,
		)
		if err != nil {
			continue
		}
		docs = append(docs, doc)
	}

	if len(docs) == 0 {
		return r.getMockDocuments(candidateID), nil
	}

	return docs, nil
}

func (r *ApplicationsRepository) DeleteDocument(ctx context.Context, candidateID, docID uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, `DELETE FROM candidate_documents WHERE id = $1 AND candidate_id = $2`, docID, candidateID)
	return err
}

func (r *ApplicationsRepository) GetApplicationNotes(ctx context.Context, candidateID, appID uuid.UUID) []models.ApplicationNote {
	return []models.ApplicationNote{
		{ID: uuid.New(), ApplicationID: appID, CandidateID: candidateID, NoteText: "Followed up with Sarah regarding technical assessment timeline.", CreatedAt: time.Now().Add(-5 * 24 * time.Hour), UpdatedAt: time.Now().Add(-5 * 24 * time.Hour)},
		{ID: uuid.New(), ApplicationID: appID, CandidateID: candidateID, NoteText: "Prepared system architecture diagrams for microservices discussion.", CreatedAt: time.Now().Add(-1 * 24 * time.Hour), UpdatedAt: time.Now().Add(-1 * 24 * time.Hour)},
	}
}

func (r *ApplicationsRepository) GetApplicationInterviews(ctx context.Context, candidateID, appID uuid.UUID) []models.CandidateInterview {
	return []models.CandidateInterview{
		{
			ID:             uuid.New(),
			ApplicationID:  appID,
			JobTitle:       "Senior Frontend Engineer",
			CompanyName:    "Acme Corp",
			CompanyLogo:    "/images/companies/acme.png",
			Title:          "System Design & Frontend Architecture",
			Status:         "scheduled",
			ScheduledStart: time.Now().Add(24 * time.Hour),
			ScheduledEnd:   time.Now().Add(25 * time.Hour),
			LocationType:   "virtual",
			MeetingLink:    "https://meet.kirmya.com/acme-tech-01",
			Notes:          "Focus on SSR hydration, caching strategy, and MUI v6 design tokens.",
			Interviewer:    "Sarah Jenkins (Engineering Manager)",
		},
	}
}

// Fallback stubs for initial environment / offline testing
func (r *ApplicationsRepository) getMockApplications(candidateID uuid.UUID) []models.ApplicationSummary {
	now := time.Now()
	recID := uuid.New()
	return []models.ApplicationSummary{
		{
			ID:              uuid.MustParse("10000000-0000-0000-0000-000000000001"),
			JobID:           uuid.MustParse("20000000-0000-0000-0000-000000000001"),
			JobTitle:        "Staff Frontend Engineer",
			CompanyID:       uuid.MustParse("30000000-0000-0000-0000-000000000001"),
			CompanyName:     "Kirmya AI Technologies",
			CompanyLogo:     "/images/companies/kirmya.png",
			Location:        "San Francisco, CA (Remote)",
			EmploymentType:  "Full-time",
			SalaryRange:     "$160,000 - $200,000",
			CurrentStatus:   models.StageInterview,
			AppliedAt:       now.Add(-12 * 24 * time.Hour),
			LastUpdate:      now.Add(-2 * 24 * time.Hour),
			RecruiterID:     &recID,
			RecruiterName:   "Alex Rivera",
			RecruiterEmail:  "a.rivera@kirmya.com",
			RecruiterAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
			IsSaved:         true,
			NotesCount:      3,
		},
		{
			ID:              uuid.MustParse("10000000-0000-0000-0000-000000000002"),
			JobID:           uuid.MustParse("20000000-0000-0000-0000-000000000002"),
			JobTitle:        "Lead Full-Stack Architect",
			CompanyID:       uuid.MustParse("30000000-0000-0000-0000-000000000002"),
			CompanyName:     "CloudScale Solutions",
			CompanyLogo:     "/images/companies/cloudscale.png",
			Location:        "New York, NY (Hybrid)",
			EmploymentType:  "Full-time",
			SalaryRange:     "$175,000 - $210,000",
			CurrentStatus:   models.StageShortlisted,
			AppliedAt:       now.Add(-8 * 24 * time.Hour),
			LastUpdate:      now.Add(-1 * 24 * time.Hour),
			RecruiterID:     &recID,
			RecruiterName:   "Elena Rostova",
			RecruiterEmail:  "elena@cloudscale.io",
			RecruiterAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
			IsSaved:         false,
			NotesCount:      1,
		},
		{
			ID:              uuid.MustParse("10000000-0000-0000-0000-000000000003"),
			JobID:           uuid.MustParse("20000000-0000-0000-0000-000000000003"),
			JobTitle:        "Senior UI/UX & Web Developer",
			CompanyID:       uuid.MustParse("30000000-0000-0000-0000-000000000004"),
			CompanyName:     "DesignCraft Studio",
			CompanyLogo:     "/images/companies/designcraft.png",
			Location:        "Austin, TX",
			EmploymentType:  "Full-time",
			SalaryRange:     "$140,000 - $165,000",
			CurrentStatus:   models.StageOffer,
			AppliedAt:       now.Add(-20 * 24 * time.Hour),
			LastUpdate:      now.Add(-12 * time.Hour),
			RecruiterID:     &recID,
			RecruiterName:   "Marcus Thorne",
			RecruiterEmail:  "marcus@designcraft.com",
			RecruiterAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
			IsSaved:         true,
			NotesCount:      5,
		},
		{
			ID:             uuid.MustParse("10000000-0000-0000-0000-000000000004"),
			JobID:          uuid.MustParse("20000000-0000-0000-0000-000000000004"),
			JobTitle:       "Golang Microservices Engineer",
			CompanyID:      uuid.MustParse("30000000-0000-0000-0000-000000000005"),
			CompanyName:    "HyperDrive Labs",
			CompanyLogo:    "/images/companies/hyperdrive.png",
			Location:       "Seattle, WA",
			EmploymentType: "Contract",
			SalaryRange:    "$90 - $115 / hr",
			CurrentStatus:  models.StageApplied,
			AppliedAt:      now.Add(-3 * 24 * time.Hour),
			LastUpdate:     now.Add(-3 * 24 * time.Hour),
			IsSaved:        false,
			NotesCount:     0,
		},
	}
}

func (r *ApplicationsRepository) getMockApplicationDetail(ctx context.Context, appID uuid.UUID) *models.ApplicationDetail {
	apps := r.getMockApplications(uuid.Nil)
	summary := apps[0]
	if len(apps) > 0 {
		summary = apps[0]
	}

	return &models.ApplicationDetail{
		Summary: summary,
		JobDescription: `We are building the next generation AI-assisted career platform. You will lead key frontend modules utilizing Next.js, TypeScript, MUI v6, and Framer Motion with enterprise glassmorphic interfaces.

Key Responsibilities:
- Design & develop high-performance candidate application management features.
- Build responsive, accessible, dark/light theme React components.
- Collaborate with backend engineers on Golang/Gin microservices and REST API endpoints.`,
		Requirements: []string{
			"5+ years of professional Frontend Software Engineering experience",
			"Expertise in Next.js, React, TypeScript, and MUI v6",
			"Proven track record building glassmorphism UI & responsive dashboards",
			"Strong understanding of RESTful architecture, React Query, and state management",
		},
		Skills:   []string{"Next.js", "TypeScript", "MUI v6", "React Query", "Golang", "PostgreSQL", "Framer Motion"},
		Timeline: r.GetApplicationTimeline(ctx, appID),
		SubmittedResume: &models.CandidateDocument{
			ID:           uuid.New(),
			CandidateID:  uuid.Nil,
			Title:        "Staff_Software_Engineer_Resume_2026.pdf",
			DocumentType: "Resume",
			FileURL:      "https://storage.kirmya.com/resumes/staff-engineer-2026.pdf",
			SizeBytes:    1048576,
			FileType:     "application/pdf",
			IsDefault:    true,
			UploadedAt:   time.Now().Add(-30 * 24 * time.Hour),
		},
		SubmittedCoverLetter: &models.CandidateDocument{
			ID:           uuid.New(),
			CandidateID:  uuid.Nil,
			Title:        "Kirmya_Cover_Letter.pdf",
			DocumentType: "Cover Letter",
			FileURL:      "https://storage.kirmya.com/docs/cover-letter.pdf",
			SizeBytes:    450000,
			FileType:     "application/pdf",
			IsDefault:    false,
			UploadedAt:   time.Now().Add(-12 * 24 * time.Hour),
		},
		Notes:      r.GetApplicationNotes(ctx, uuid.Nil, appID),
		Interviews: r.GetApplicationInterviews(ctx, uuid.Nil, appID),
		Offer: &models.JobOfferDTO{
			ID:            uuid.New(),
			ApplicationID: appID,
			PositionTitle: "Staff Frontend Engineer",
			Salary:        "$185,000",
			Currency:      "USD",
			Benefits:      "Health, 401k match (5%), stock options, unlimited PTO",
			Status:        "Sent",
			CreatedAt:     time.Now().Add(-1 * 24 * time.Hour),
		},
	}
}

func (r *ApplicationsRepository) getMockSavedJobs(candidateID uuid.UUID) []models.SavedJobDTO {
	now := time.Now()
	return []models.SavedJobDTO{
		{
			ID:             uuid.New(),
			CandidateID:    candidateID,
			JobID:          uuid.New(),
			JobTitle:       "Principal Frontend Architect",
			CompanyName:    "Stripe",
			CompanyLogo:    "/images/companies/stripe.png",
			Location:       "San Francisco, CA (Remote)",
			SalaryRange:    "$220,000 - $270,000",
			EmploymentType: "Full-time",
			CollectionName: "Dream Jobs",
			Notes:          "Highly recommended role by peer network. Apply before next Friday.",
			SavedAt:        now.Add(-2 * 24 * time.Hour),
		},
		{
			ID:             uuid.New(),
			CandidateID:    candidateID,
			JobID:          uuid.New(),
			JobTitle:       "Senior Distributed Systems Engineer",
			CompanyName:    "Datadog",
			CompanyLogo:    "/images/companies/datadog.png",
			Location:       "New York, NY",
			SalaryRange:    "$180,000 - $220,000",
			EmploymentType: "Full-time",
			CollectionName: "High Salary Jobs",
			Notes:          "Great tech stack: Golang, Rust, PostgreSQL, Redis.",
			SavedAt:        now.Add(-5 * 24 * time.Hour),
		},
	}
}

func (r *ApplicationsRepository) getMockJobAlerts(candidateID uuid.UUID) []models.JobAlertDTO {
	return []models.JobAlertDTO{
		{
			ID:             uuid.New(),
			CandidateID:    candidateID,
			Title:          "Senior React & Next.js Roles",
			Keywords:       "React Next.js TypeScript MUI",
			JobTitles:      []string{"Senior Frontend Engineer", "Staff Web Engineer", "UI Architect"},
			Skills:         []string{"React", "TypeScript", "Next.js", "MUI"},
			Location:       "Remote",
			Industry:       "Technology / SaaS",
			SalaryMin:      150000,
			SalaryMax:      220000,
			EmploymentType: "Full-time",
			Frequency:      "Daily",
			ChannelEmail:   true,
			ChannelPush:    true,
			ChannelInApp:   true,
			IsActive:       true,
			CreatedAt:      time.Now().Add(-14 * 24 * time.Hour),
			UpdatedAt:      time.Now().Add(-14 * 24 * time.Hour),
		},
	}
}

func (r *ApplicationsRepository) getMockInterviews(candidateID uuid.UUID) []models.CandidateInterview {
	return []models.CandidateInterview{
		{
			ID:             uuid.New(),
			ApplicationID:  uuid.MustParse("10000000-0000-0000-0000-000000000001"),
			JobTitle:       "Staff Frontend Engineer",
			CompanyName:    "Kirmya AI Technologies",
			CompanyLogo:    "/images/companies/kirmya.png",
			Title:          "Architecture & Technical Deep Dive",
			Status:         "scheduled",
			ScheduledStart: time.Now().Add(18 * time.Hour),
			ScheduledEnd:   time.Now().Add(19 * time.Hour),
			LocationType:   "virtual",
			MeetingLink:    "https://meet.kirmya.com/int-kirmya-tech",
			Notes:          "Be ready to present Next.js rendering strategies and MUI v6 customization.",
			Interviewer:    "Alex Rivera (Principal Architect)",
		},
	}
}

func (r *ApplicationsRepository) getMockDocuments(candidateID uuid.UUID) []models.CandidateDocument {
	return []models.CandidateDocument{
		{
			ID:           uuid.New(),
			CandidateID:  candidateID,
			Title:        "Staff_Software_Engineer_Resume_2026.pdf",
			DocumentType: "Resume",
			FileURL:      "https://storage.kirmya.com/resumes/staff-engineer-2026.pdf",
			SizeBytes:    1048576,
			FileType:     "application/pdf",
			IsDefault:    true,
			UploadedAt:   time.Now().Add(-30 * 24 * time.Hour),
		},
		{
			ID:           uuid.New(),
			CandidateID:  candidateID,
			Title:        "AWS_Certified_Solutions_Architect.pdf",
			DocumentType: "Certificate",
			FileURL:      "https://storage.kirmya.com/certs/aws-architect.pdf",
			SizeBytes:    750000,
			FileType:     "application/pdf",
			IsDefault:    false,
			UploadedAt:   time.Now().Add(-60 * 24 * time.Hour),
		},
	}
}
