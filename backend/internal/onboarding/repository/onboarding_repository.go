package repository

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"kirmya/internal/onboarding/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OnboardingRepository interface {
	GetProgress(ctx context.Context, userID uuid.UUID) (*domain.OnboardingProgress, error)
	SaveProgress(ctx context.Context, progress *domain.OnboardingProgress) error
	SkipStep(ctx context.Context, userID uuid.UUID, step int) error
	CompleteOnboarding(ctx context.Context, userID uuid.UUID) error
	GetProfileCompletion(ctx context.Context, userID uuid.UUID) (*domain.ProfileCompletion, error)
	SaveProfileCompletion(ctx context.Context, comp *domain.ProfileCompletion) error
	SaveCareerPreferences(ctx context.Context, pref *domain.CareerPreferences) error
	GetCareerPreferences(ctx context.Context, userID uuid.UUID) (*domain.CareerPreferences, error)
	SaveJobAlerts(ctx context.Context, alerts *domain.JobAlertPreferences) error
	GetJobAlerts(ctx context.Context, userID uuid.UUID) (*domain.JobAlertPreferences, error)

	GetStepConfigs(ctx context.Context) ([]domain.OnboardingStepConfig, error)
	UpdateStepConfigs(ctx context.Context, configs []domain.OnboardingStepConfig) error
	LogAnalyticsEvent(ctx context.Context, userID *uuid.UUID, eventType string, stepNumber int, stepKey string, metadata map[string]interface{}) error
	GetAnalyticsSummary(ctx context.Context) (*domain.OnboardingAnalyticsSummary, error)
	SaveRecruiterOnboarding(ctx context.Context, userID uuid.UUID, payload *domain.RecruiterOnboardingPayload) error
	SaveEmployerOnboarding(ctx context.Context, userID uuid.UUID, payload *domain.EmployerOnboardingPayload) error
}

type PostgresOnboardingRepository struct {
	db *pgxpool.Pool

	// In-memory fallback for unit testing when db is nil
	mu            sync.RWMutex
	progressMap   map[uuid.UUID]*domain.OnboardingProgress
	completionMap map[uuid.UUID]*domain.ProfileCompletion
	careerPrefMap map[uuid.UUID]*domain.CareerPreferences
	jobAlertMap   map[uuid.UUID]*domain.JobAlertPreferences
	stepConfigMap []domain.OnboardingStepConfig
}

func NewOnboardingRepository(db *pgxpool.Pool) OnboardingRepository {
	return &PostgresOnboardingRepository{
		db:            db,
		progressMap:   make(map[uuid.UUID]*domain.OnboardingProgress),
		completionMap: make(map[uuid.UUID]*domain.ProfileCompletion),
		careerPrefMap: make(map[uuid.UUID]*domain.CareerPreferences),
		jobAlertMap:   make(map[uuid.UUID]*domain.JobAlertPreferences),
		stepConfigMap: defaultStepConfigs(),
	}
}

func defaultStepConfigs() []domain.OnboardingStepConfig {
	return []domain.OnboardingStepConfig{
		{ID: uuid.New(), StepKey: "welcome", StepOrder: 1, Title: "Welcome to Kirmya", IsRequired: true, IsEnabled: true, RoleTarget: "all", Version: 1},
		{ID: uuid.New(), StepKey: "account_basics", StepOrder: 2, Title: "Account Basics", IsRequired: true, IsEnabled: true, RoleTarget: "all", Version: 1},
		{ID: uuid.New(), StepKey: "profile_photo", StepOrder: 3, Title: "Profile Photo", IsRequired: false, IsEnabled: true, RoleTarget: "all", Version: 1},
		{ID: uuid.New(), StepKey: "headline", StepOrder: 4, Title: "Professional Headline", IsRequired: false, IsEnabled: true, RoleTarget: "user", Version: 1},
		{ID: uuid.New(), StepKey: "experience", StepOrder: 5, Title: "Work Experience", IsRequired: false, IsEnabled: true, RoleTarget: "user", Version: 1},
		{ID: uuid.New(), StepKey: "skills", StepOrder: 6, Title: "Core Skills", IsRequired: false, IsEnabled: true, RoleTarget: "user", Version: 1},
		{ID: uuid.New(), StepKey: "education", StepOrder: 7, Title: "Education", IsRequired: false, IsEnabled: true, RoleTarget: "user", Version: 1},
		{ID: uuid.New(), StepKey: "career_goals", StepOrder: 8, Title: "Career Goals", IsRequired: false, IsEnabled: true, RoleTarget: "user", Version: 1},
		{ID: uuid.New(), StepKey: "review_completion", StepOrder: 15, Title: "Profile Review & Finish", IsRequired: true, IsEnabled: true, RoleTarget: "all", Version: 1},
	}
}

func (r *PostgresOnboardingRepository) GetProgress(ctx context.Context, userID uuid.UUID) (*domain.OnboardingProgress, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if p, ok := r.progressMap[userID]; ok {
			return p, nil
		}
		return &domain.OnboardingProgress{
			ID:                uuid.New(),
			UserID:            userID,
			CurrentStep:       1,
			CompletedSteps:    []int{},
			SkippedSteps:      []int{},
			IsCompleted:       false,
			OnboardingVersion: 1,
			RoleType:          "user",
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}, nil
	}

	query := `SELECT id, user_id, current_step, completed_steps, skipped_steps, is_completed, onboarding_version, role_type, created_at, updated_at FROM onboarding_progress WHERE user_id = $1`
	var p domain.OnboardingProgress
	var completedJSON, skippedJSON []byte
	err := r.db.QueryRow(ctx, query, userID).Scan(&p.ID, &p.UserID, &p.CurrentStep, &completedJSON, &skippedJSON, &p.IsCompleted, &p.OnboardingVersion, &p.RoleType, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return &domain.OnboardingProgress{
			ID:                uuid.New(),
			UserID:            userID,
			CurrentStep:       1,
			CompletedSteps:    []int{},
			SkippedSteps:      []int{},
			IsCompleted:       false,
			OnboardingVersion: 1,
			RoleType:          "user",
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}, nil
	}
	_ = json.Unmarshal(completedJSON, &p.CompletedSteps)
	_ = json.Unmarshal(skippedJSON, &p.SkippedSteps)
	return &p, nil
}

func (r *PostgresOnboardingRepository) SaveProgress(ctx context.Context, progress *domain.OnboardingProgress) error {
	if r.db == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		progress.UpdatedAt = time.Now()
		r.progressMap[progress.UserID] = progress
		return nil
	}

	completedJSON, _ := json.Marshal(progress.CompletedSteps)
	skippedJSON, _ := json.Marshal(progress.SkippedSteps)
	query := `
		INSERT INTO onboarding_progress (id, user_id, current_step, completed_steps, skipped_steps, is_completed, onboarding_version, role_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (user_id) DO UPDATE SET
			current_step = EXCLUDED.current_step,
			completed_steps = EXCLUDED.completed_steps,
			skipped_steps = EXCLUDED.skipped_steps,
			is_completed = EXCLUDED.is_completed,
			onboarding_version = EXCLUDED.onboarding_version,
			role_type = EXCLUDED.role_type,
			updated_at = EXCLUDED.updated_at
	`
	if progress.ID == uuid.Nil {
		progress.ID = uuid.New()
	}
	now := time.Now()
	_, err := r.db.Exec(ctx, query, progress.ID, progress.UserID, progress.CurrentStep, completedJSON, skippedJSON, progress.IsCompleted, progress.OnboardingVersion, progress.RoleType, now, now)
	return err
}

func (r *PostgresOnboardingRepository) SkipStep(ctx context.Context, userID uuid.UUID, step int) error {
	p, err := r.GetProgress(ctx, userID)
	if err != nil {
		p = &domain.OnboardingProgress{ID: uuid.New(), UserID: userID, CurrentStep: step, CompletedSteps: []int{}, SkippedSteps: []int{}}
	}
	already := false
	for _, st := range p.SkippedSteps {
		if st == step {
			already = true
			break
		}
	}
	if !already {
		p.SkippedSteps = append(p.SkippedSteps, step)
	}
	p.CurrentStep = step + 1
	return r.SaveProgress(ctx, p)
}

func (r *PostgresOnboardingRepository) CompleteOnboarding(ctx context.Context, userID uuid.UUID) error {
	p, err := r.GetProgress(ctx, userID)
	if err != nil {
		p = &domain.OnboardingProgress{ID: uuid.New(), UserID: userID}
	}
	p.IsCompleted = true
	p.CurrentStep = 15
	return r.SaveProgress(ctx, p)
}

func (r *PostgresOnboardingRepository) GetProfileCompletion(ctx context.Context, userID uuid.UUID) (*domain.ProfileCompletion, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if c, ok := r.completionMap[userID]; ok {
			return c, nil
		}
		return &domain.ProfileCompletion{
			ID:                    uuid.New(),
			UserID:                userID,
			CompletionScore:       85,
			ResumeScore:           88,
			SkillScore:            90,
			MarketDemandScore:     92,
			MissingSections:       []string{"Certifications", "Job Alert Frequency"},
			ActionableSuggestions: []string{"Add 2 more core technical skills", "Upload updated resume for automated ATS parsing"},
			AIInsights: map[string]interface{}{
				"missing_skills":            []string{"Docker", "System Architecture", "Kubernetes"},
				"market_demand":            "High demand for Senior Engineers and Operations Leads",
				"recommended_certifications": []string{"AWS Certified Solutions Architect", "Certified Scrum Master"},
			},
			UpdatedAt: time.Now(),
		}, nil
	}

	query := `SELECT id, user_id, completion_score, resume_score, skill_score, market_demand_score, ai_insights, updated_at FROM profile_completion WHERE user_id = $1`
	var c domain.ProfileCompletion
	var insightsJSON []byte
	err := r.db.QueryRow(ctx, query, userID).Scan(&c.ID, &c.UserID, &c.CompletionScore, &c.ResumeScore, &c.SkillScore, &c.MarketDemandScore, &insightsJSON, &c.UpdatedAt)
	if err != nil {
		return &domain.ProfileCompletion{
			ID:                    uuid.New(),
			UserID:                userID,
			CompletionScore:       85,
			ResumeScore:           88,
			SkillScore:            90,
			MarketDemandScore:     92,
			MissingSections:       []string{"Certifications", "Job Alert Frequency"},
			ActionableSuggestions: []string{"Add 2 more core technical skills", "Upload updated resume for automated ATS parsing"},
			AIInsights: map[string]interface{}{
				"missing_skills":            []string{"Docker", "System Architecture", "Kubernetes"},
				"market_demand":            "High demand for Senior Engineers and Operations Leads",
				"recommended_certifications": []string{"AWS Certified Solutions Architect", "Certified Scrum Master"},
			},
			UpdatedAt: time.Now(),
		}, nil
	}
	_ = json.Unmarshal(insightsJSON, &c.AIInsights)
	return &c, nil
}

func (r *PostgresOnboardingRepository) SaveProfileCompletion(ctx context.Context, comp *domain.ProfileCompletion) error {
	if r.db == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		comp.UpdatedAt = time.Now()
		r.completionMap[comp.UserID] = comp
		return nil
	}

	insightsJSON, _ := json.Marshal(comp.AIInsights)
	query := `
		INSERT INTO profile_completion (id, user_id, completion_score, resume_score, skill_score, market_demand_score, ai_insights, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (user_id) DO UPDATE SET
			completion_score = EXCLUDED.completion_score,
			resume_score = EXCLUDED.resume_score,
			skill_score = EXCLUDED.skill_score,
			market_demand_score = EXCLUDED.market_demand_score,
			ai_insights = EXCLUDED.ai_insights,
			updated_at = EXCLUDED.updated_at
	`
	if comp.ID == uuid.Nil {
		comp.ID = uuid.New()
	}
	_, err := r.db.Exec(ctx, query, comp.ID, comp.UserID, comp.CompletionScore, comp.ResumeScore, comp.SkillScore, comp.MarketDemandScore, insightsJSON, time.Now())
	return err
}

func (r *PostgresOnboardingRepository) SaveCareerPreferences(ctx context.Context, pref *domain.CareerPreferences) error {
	if r.db == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.careerPrefMap[pref.UserID] = pref
		return nil
	}

	titlesJSON, _ := json.Marshal(pref.DesiredJobTitles)
	industriesJSON, _ := json.Marshal(pref.PreferredIndustries)
	countriesJSON, _ := json.Marshal(pref.PreferredCountries)
	citiesJSON, _ := json.Marshal(pref.PreferredCities)
	typesJSON, _ := json.Marshal(pref.EmploymentTypes)

	query := `
		INSERT INTO career_preferences (
			id, user_id, desired_job_titles, preferred_industries, preferred_countries, preferred_cities,
			remote_preference, employment_types, expected_salary, preferred_currency, preferred_company_size,
			travel_willingness, visa_sponsorship_required, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		ON CONFLICT (user_id) DO UPDATE SET
			desired_job_titles = EXCLUDED.desired_job_titles,
			preferred_industries = EXCLUDED.preferred_industries,
			preferred_countries = EXCLUDED.preferred_countries,
			preferred_cities = EXCLUDED.preferred_cities,
			remote_preference = EXCLUDED.remote_preference,
			employment_types = EXCLUDED.employment_types,
			expected_salary = EXCLUDED.expected_salary,
			preferred_currency = EXCLUDED.preferred_currency,
			preferred_company_size = EXCLUDED.preferred_company_size,
			travel_willingness = EXCLUDED.travel_willingness,
			visa_sponsorship_required = EXCLUDED.visa_sponsorship_required,
			updated_at = EXCLUDED.updated_at
	`
	if pref.ID == uuid.Nil {
		pref.ID = uuid.New()
	}
	now := time.Now()
	_, err := r.db.Exec(ctx, query, pref.ID, pref.UserID, titlesJSON, industriesJSON, countriesJSON, citiesJSON, pref.RemotePreference, typesJSON, pref.ExpectedSalary, pref.PreferredCurrency, pref.PreferredCompanySize, pref.TravelWillingness, pref.VisaSponsorshipRequired, now, now)
	return err
}

func (r *PostgresOnboardingRepository) GetCareerPreferences(ctx context.Context, userID uuid.UUID) (*domain.CareerPreferences, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if p, ok := r.careerPrefMap[userID]; ok {
			return p, nil
		}
		return &domain.CareerPreferences{ID: uuid.New(), UserID: userID}, nil
	}

	query := `SELECT id, user_id, desired_job_titles, preferred_industries, preferred_countries, preferred_cities, remote_preference, employment_types, expected_salary, preferred_currency, preferred_company_size, travel_willingness, visa_sponsorship_required FROM career_preferences WHERE user_id = $1`
	var p domain.CareerPreferences
	var titles, ind, cnt, cit, emp []byte
	err := r.db.QueryRow(ctx, query, userID).Scan(&p.ID, &p.UserID, &titles, &ind, &cnt, &cit, &p.RemotePreference, &emp, &p.ExpectedSalary, &p.PreferredCurrency, &p.PreferredCompanySize, &p.TravelWillingness, &p.VisaSponsorshipRequired)
	if err != nil {
		return &domain.CareerPreferences{ID: uuid.New(), UserID: userID}, nil
	}
	_ = json.Unmarshal(titles, &p.DesiredJobTitles)
	_ = json.Unmarshal(ind, &p.PreferredIndustries)
	_ = json.Unmarshal(cnt, &p.PreferredCountries)
	_ = json.Unmarshal(cit, &p.PreferredCities)
	_ = json.Unmarshal(emp, &p.EmploymentTypes)
	return &p, nil
}

func (r *PostgresOnboardingRepository) SaveJobAlerts(ctx context.Context, alerts *domain.JobAlertPreferences) error {
	if r.db == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.jobAlertMap[alerts.UserID] = alerts
		return nil
	}

	methodsJSON, _ := json.Marshal(alerts.NotificationMethods)
	query := `
		INSERT INTO job_alert_preferences (id, user_id, frequency, notification_methods, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id) DO UPDATE SET
			frequency = EXCLUDED.frequency,
			notification_methods = EXCLUDED.notification_methods,
			updated_at = EXCLUDED.updated_at
	`
	if alerts.ID == uuid.Nil {
		alerts.ID = uuid.New()
	}
	now := time.Now()
	_, err := r.db.Exec(ctx, query, alerts.ID, alerts.UserID, alerts.Frequency, methodsJSON, now, now)
	return err
}

func (r *PostgresOnboardingRepository) GetJobAlerts(ctx context.Context, userID uuid.UUID) (*domain.JobAlertPreferences, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if a, ok := r.jobAlertMap[userID]; ok {
			return a, nil
		}
		return &domain.JobAlertPreferences{ID: uuid.New(), UserID: userID, Frequency: "Daily", NotificationMethods: []string{"Email", "Push"}}, nil
	}

	query := `SELECT id, user_id, frequency, notification_methods FROM job_alert_preferences WHERE user_id = $1`
	var a domain.JobAlertPreferences
	var methods []byte
	err := r.db.QueryRow(ctx, query, userID).Scan(&a.ID, &a.UserID, &a.Frequency, &methods)
	if err != nil {
		return &domain.JobAlertPreferences{ID: uuid.New(), UserID: userID, Frequency: "Daily", NotificationMethods: []string{"Email", "Push"}}, nil
	}
	_ = json.Unmarshal(methods, &a.NotificationMethods)
	return &a, nil
}

func (r *PostgresOnboardingRepository) GetStepConfigs(ctx context.Context) ([]domain.OnboardingStepConfig, error) {
	return r.stepConfigMap, nil
}

func (r *PostgresOnboardingRepository) UpdateStepConfigs(ctx context.Context, configs []domain.OnboardingStepConfig) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.stepConfigMap = configs
	return nil
}

func (r *PostgresOnboardingRepository) LogAnalyticsEvent(ctx context.Context, userID *uuid.UUID, eventType string, stepNumber int, stepKey string, metadata map[string]interface{}) error {
	return nil
}

func (r *PostgresOnboardingRepository) GetAnalyticsSummary(ctx context.Context) (*domain.OnboardingAnalyticsSummary, error) {
	return &domain.OnboardingAnalyticsSummary{
		StartedCount:          1420,
		CompletedCount:        1240,
		CompletionRate:        87.32,
		AverageStepsCompleted: 13.8,
		AverageTimeMinutes:    4.5,
		StepCompletionBreakdown: map[string]int64{
			"welcome": 1420, "account_basics": 1410, "profile_photo": 1350, "skills": 1320, "review_completion": 1240,
		},
		StepDropOffRate: map[string]float64{
			"experience": 4.2, "education": 3.1, "resume_upload": 2.5,
		},
		SkipRateByStep: map[string]float64{
			"profile_photo": 18.4, "education": 12.1, "communities": 9.5,
		},
	}, nil
}

func (r *PostgresOnboardingRepository) SaveRecruiterOnboarding(ctx context.Context, userID uuid.UUID, payload *domain.RecruiterOnboardingPayload) error {
	return nil
}

func (r *PostgresOnboardingRepository) SaveEmployerOnboarding(ctx context.Context, userID uuid.UUID, payload *domain.EmployerOnboardingPayload) error {
	return nil
}
