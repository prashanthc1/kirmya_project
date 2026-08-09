package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"kirmya/internal/job_alerts/models"
)

type JobAlertsRepository struct {
	db *pgxpool.Pool
}

func NewJobAlertsRepository(db *pgxpool.Pool) *JobAlertsRepository {
	return &JobAlertsRepository{db: db}
}

func (r *JobAlertsRepository) GetJobAlertsByCandidateID(ctx context.Context, candidateID uuid.UUID) ([]models.JobAlert, error) {
	query := `
		SELECT id, candidate_id, title, COALESCE(keywords,''), COALESCE(job_titles,'{}'), COALESCE(skills,'{}'),
		       COALESCE(location,''), COALESCE(industry,''), COALESCE(departments,'{}'), salary_min, salary_max,
		       COALESCE(employment_type,'Full-time'), COALESCE(experience_level,'Mid-Level'), COALESCE(country,''),
		       COALESCE(city,''), COALESCE(remote_preference,'Remote'), COALESCE(company_size,'Any'), COALESCE(company_type,'Any'),
		       visa_sponsorship, COALESCE(work_authorization,''), COALESCE(education_level,'Bachelor'), COALESCE(languages,'{}'),
		       COALESCE(exclude_keywords,''), COALESCE(frequency,'Daily'), COALESCE(custom_schedule,''), channel_email,
		       channel_push, channel_in_app, channel_sms, channel_webhook, is_active, expiry_date, created_at, updated_at
		FROM job_alerts
		WHERE candidate_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, candidateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []models.JobAlert
	for rows.Next() {
		var a models.JobAlert
		err := rows.Scan(
			&a.ID, &a.CandidateID, &a.Title, &a.Keywords, &a.JobTitles, &a.Skills,
			&a.Location, &a.Industry, &a.Departments, &a.SalaryMin, &a.SalaryMax,
			&a.EmploymentType, &a.ExperienceLevel, &a.Country, &a.City, &a.RemotePreference,
			&a.CompanySize, &a.CompanyType, &a.VisaSponsorship, &a.WorkAuthorization,
			&a.EducationLevel, &a.Languages, &a.ExcludeKeywords, &a.Frequency, &a.CustomSchedule,
			&a.ChannelEmail, &a.ChannelPush, &a.ChannelInApp, &a.ChannelSMS, &a.ChannelWebhook,
			&a.IsActive, &a.ExpiryDate, &a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		alerts = append(alerts, a)
	}
	return alerts, nil
}

func (r *JobAlertsRepository) CreateJobAlert(ctx context.Context, alert *models.JobAlert) error {
	query := `
		INSERT INTO job_alerts (
			id, candidate_id, title, keywords, job_titles, skills, location, industry, departments,
			salary_min, salary_max, employment_type, experience_level, country, city, remote_preference,
			company_size, company_type, visa_sponsorship, work_authorization, education_level, languages,
			exclude_keywords, frequency, custom_schedule, channel_email, channel_push, channel_in_app,
			channel_sms, channel_webhook, is_active, expiry_date, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
			$21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, NOW(), NOW()
		)
	`
	_, err := r.db.Exec(ctx, query,
		alert.ID, alert.CandidateID, alert.Title, alert.Keywords, alert.JobTitles, alert.Skills,
		alert.Location, alert.Industry, alert.Departments, alert.SalaryMin, alert.SalaryMax,
		alert.EmploymentType, alert.ExperienceLevel, alert.Country, alert.City, alert.RemotePreference,
		alert.CompanySize, alert.CompanyType, alert.VisaSponsorship, alert.WorkAuthorization,
		alert.EducationLevel, alert.Languages, alert.ExcludeKeywords, alert.Frequency, alert.CustomSchedule,
		alert.ChannelEmail, alert.ChannelPush, alert.ChannelInApp, alert.ChannelSMS, alert.ChannelWebhook,
		alert.IsActive, alert.ExpiryDate,
	)
	return err
}

func (r *JobAlertsRepository) UpdateJobAlert(ctx context.Context, alert *models.JobAlert) error {
	query := `
		UPDATE job_alerts SET
			title = $1, keywords = $2, job_titles = $3, skills = $4, location = $5, industry = $6,
			departments = $7, salary_min = $8, salary_max = $9, employment_type = $10, experience_level = $11,
			country = $12, city = $13, remote_preference = $14, company_size = $15, company_type = $16,
			visa_sponsorship = $17, work_authorization = $18, education_level = $19, languages = $20,
			exclude_keywords = $21, frequency = $22, custom_schedule = $23, channel_email = $24,
			channel_push = $25, channel_in_app = $26, channel_sms = $27, channel_webhook = $28,
			is_active = $29, expiry_date = $30, updated_at = NOW()
		WHERE id = $31 AND candidate_id = $32
	`
	_, err := r.db.Exec(ctx, query,
		alert.Title, alert.Keywords, alert.JobTitles, alert.Skills, alert.Location, alert.Industry,
		alert.Departments, alert.SalaryMin, alert.SalaryMax, alert.EmploymentType, alert.ExperienceLevel,
		alert.Country, alert.City, alert.RemotePreference, alert.CompanySize, alert.CompanyType,
		alert.VisaSponsorship, alert.WorkAuthorization, alert.EducationLevel, alert.Languages,
		alert.ExcludeKeywords, alert.Frequency, alert.CustomSchedule, alert.ChannelEmail,
		alert.ChannelPush, alert.ChannelInApp, alert.ChannelSMS, alert.ChannelWebhook,
		alert.IsActive, alert.ExpiryDate, alert.ID, alert.CandidateID,
	)
	return err
}

func (r *JobAlertsRepository) DeleteJobAlert(ctx context.Context, alertID, candidateID uuid.UUID) error {
	query := `DELETE FROM job_alerts WHERE id = $1 AND candidate_id = $2`
	_, err := r.db.Exec(ctx, query, alertID, candidateID)
	return err
}

func (r *JobAlertsRepository) SetJobAlertStatus(ctx context.Context, alertID, candidateID uuid.UUID, isActive bool) error {
	query := `UPDATE job_alerts SET is_active = $1, updated_at = NOW() WHERE id = $2 AND candidate_id = $3`
	_, err := r.db.Exec(ctx, query, isActive, alertID, candidateID)
	return err
}

func (r *JobAlertsRepository) GetSavedSearches(ctx context.Context, userID uuid.UUID) ([]models.SavedSearch, error) {
	query := `
		SELECT id, user_id, name, COALESCE(query_text, ''), auto_alert, alert_id, created_at, updated_at
		FROM saved_searches
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var searches []models.SavedSearch
	for rows.Next() {
		var s models.SavedSearch
		err := rows.Scan(&s.ID, &s.UserID, &s.Name, &s.QueryText, &s.AutoAlert, &s.AlertID, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		searches = append(searches, s)
	}
	return searches, nil
}

func (r *JobAlertsRepository) CreateSavedSearch(ctx context.Context, search *models.SavedSearch) error {
	query := `
		INSERT INTO saved_searches (id, user_id, name, query_text, auto_alert, alert_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
	`
	_, err := r.db.Exec(ctx, query, search.ID, search.UserID, search.Name, search.QueryText, search.AutoAlert, search.AlertID)
	return err
}

func (r *JobAlertsRepository) UpdateSavedSearch(ctx context.Context, search *models.SavedSearch) error {
	query := `
		UPDATE saved_searches SET name = $1, query_text = $2, auto_alert = $3, alert_id = $4, updated_at = NOW()
		WHERE id = $5 AND user_id = $6
	`
	_, err := r.db.Exec(ctx, query, search.Name, search.QueryText, search.AutoAlert, search.AlertID, search.ID, search.UserID)
	return err
}

func (r *JobAlertsRepository) DeleteSavedSearch(ctx context.Context, searchID, userID uuid.UUID) error {
	query := `DELETE FROM saved_searches WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(ctx, query, searchID, userID)
	return err
}

func (r *JobAlertsRepository) SaveRecommendationFeedback(ctx context.Context, userID uuid.UUID, req models.RecommendationFeedbackRequest) error {
	query := `
		INSERT INTO recommendation_feedback (id, user_id, job_id, recommendation_id, action_type, feedback_reason, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
	`
	recID := uuid.New()
	_, err := r.db.Exec(ctx, query, recID, userID, req.JobID, req.RecommendationID, req.ActionType, req.FeedbackReason)
	return err
}

func (r *JobAlertsRepository) GetAlertDeliveryHistory(ctx context.Context, candidateID uuid.UUID) ([]models.AlertDeliveryHistory, error) {
	query := `
		SELECT adh.id, adh.alert_id, adh.candidate_id, COALESCE(ja.title, 'Job Alert Digest'),
		       adh.delivery_channel, adh.jobs_included, adh.jobs_opened, adh.jobs_clicked,
		       adh.applications_submitted, adh.delivery_status, adh.sent_at
		FROM alert_delivery_history adh
		LEFT JOIN job_alerts ja ON adh.alert_id = ja.id
		WHERE adh.candidate_id = $1
		ORDER BY adh.sent_at DESC
		LIMIT 50
	`
	rows, err := r.db.Query(ctx, query, candidateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []models.AlertDeliveryHistory
	for rows.Next() {
		var h models.AlertDeliveryHistory
		err := rows.Scan(
			&h.ID, &h.AlertID, &h.CandidateID, &h.AlertTitle, &h.DeliveryChannel,
			&h.JobsIncluded, &h.JobsOpened, &h.JobsClicked, &h.ApplicationsSubmitted,
			&h.DeliveryStatus, &h.SentAt,
		)
		if err != nil {
			return nil, err
		}
		history = append(history, h)
	}
	return history, nil
}
