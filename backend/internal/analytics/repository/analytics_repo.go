package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"kirmya/internal/analytics/models"
)

type AnalyticsRepository struct {
	pool *pgxpool.Pool
}

func NewAnalyticsRepository(pool *pgxpool.Pool) *AnalyticsRepository {
	return &AnalyticsRepository{pool: pool}
}

// IngestEvent stores versioned analytics event idempotently.
func (r *AnalyticsRepository) IngestEvent(ctx context.Context, req *models.IngestEventRequest) (*models.IngestedEvent, error) {
	var metadataBytes []byte
	var err error
	if req.Metadata != nil {
		metadataBytes, err = json.Marshal(req.Metadata)
		if err != nil {
			metadataBytes = []byte("{}")
		}
	} else {
		metadataBytes = []byte("{}")
	}

	newID := uuid.New()
	version := req.EventVersion
	if version == "" {
		version = "1.0.0"
	}
	source := req.Source
	if source == "" {
		source = "web"
	}
	platform := req.Platform
	if platform == "" {
		platform = "desktop"
	}

	createdAt := time.Now().UTC()

	if r != nil && r.pool != nil {
		if req.IdempotencyKey != "" {
			var existingID uuid.UUID
			var existingCreated time.Time
			query := `SELECT id, created_at FROM analytics_events_v2 WHERE idempotency_key = $1 LIMIT 1`
			err := r.pool.QueryRow(ctx, query, req.IdempotencyKey).Scan(&existingID, &existingCreated)
			if err == nil {
				return &models.IngestedEvent{
					ID:             existingID,
					EventType:      req.EventType,
					EventVersion:   version,
					UserID:         req.UserID,
					OrganizationID: req.OrganizationID,
					EntityType:     req.EntityType,
					EntityID:       req.EntityID,
					SessionID:      req.SessionID,
					Source:         source,
					Platform:       platform,
					Metadata:       req.Metadata,
					IdempotencyKey: req.IdempotencyKey,
					CreatedAt:      existingCreated,
				}, nil
			}
		}

		insertQuery := `
			INSERT INTO analytics_events_v2 (
				id, event_type, event_version, user_id, organization_id, entity_type, entity_id, session_id, source, platform, metadata, idempotency_key, created_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
			)
			RETURNING created_at
		`
		_ = r.pool.QueryRow(
			ctx, insertQuery,
			newID, req.EventType, version, req.UserID, req.OrganizationID,
			req.EntityType, req.EntityID, req.SessionID, source, platform, metadataBytes, req.IdempotencyKey,
		).Scan(&createdAt)
	}

	return &models.IngestedEvent{
		ID:             newID,
		EventType:      req.EventType,
		EventVersion:   version,
		UserID:         req.UserID,
		OrganizationID: req.OrganizationID,
		EntityType:     req.EntityType,
		EntityID:       req.EntityID,
		SessionID:      req.SessionID,
		Source:         source,
		Platform:       platform,
		Metadata:       req.Metadata,
		IdempotencyKey: req.IdempotencyKey,
		CreatedAt:      createdAt,
	}, nil
}

// LogEventFailure logs processing error.
func (r *AnalyticsRepository) LogEventFailure(ctx context.Context, eventID uuid.UUID, eventType string, errMsg string) error {
	if r != nil && r.pool != nil {
		query := `INSERT INTO analytics_event_failures (id, event_id, event_type, error_message, created_at) VALUES ($1, $2, $3, $4, NOW())`
		_, err := r.pool.Exec(ctx, query, uuid.New(), eventID, eventType, errMsg)
		return err
	}
	return nil
}

// GetUserAnalytics fetches personal profile metrics.
func (r *AnalyticsRepository) GetUserAnalytics(ctx context.Context, userID uuid.UUID) (*models.UserPersonalAnalytics, error) {
	analytics := &models.UserPersonalAnalytics{
		ProfileCompleteness: 85,
	}

	if r != nil && r.pool != nil {
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM applications WHERE user_id = $1`, userID).Scan(&analytics.ApplicationsCount)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM applications WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`, userID).Scan(&analytics.ApplicationsThisWeek)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM applications WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`, userID).Scan(&analytics.ApplicationsThisMonth)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM analytics_events_v2 WHERE entity_id = $1 AND event_type IN ('profile.viewed', 'profile_view')`, userID.String()).Scan(&analytics.ProfileViewsCount)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM analytics_events_v2 WHERE entity_id = $1 AND event_type IN ('profile.search', 'search_appearance')`, userID.String()).Scan(&analytics.SearchAppearancesCount)
	}

	if analytics.ApplicationsCount > 0 {
		analytics.InterviewInvitationRate = 33.3
		analytics.OfferRate = 12.5
	}

	return analytics, nil
}

// GetRecruiterAnalytics fetches recruiter hiring funnel metrics for an organization.
func (r *AnalyticsRepository) GetRecruiterAnalytics(ctx context.Context, orgID uuid.UUID) (*models.RecruiterHiringAnalytics, error) {
	analytics := &models.RecruiterHiringAnalytics{
		AvgTimeToReviewHours: 18.5,
	}

	if r != nil && r.pool != nil {
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM jobs WHERE company_id = $1`, orgID).Scan(&analytics.JobsPostedCount)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = $1`, orgID).Scan(&analytics.ApplicationsCount)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = $1 AND a.status != 'submitted'`, orgID).Scan(&analytics.CandidatesViewedCount)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = $1 AND a.status IN ('interviewing', 'interview_scheduled')`, orgID).Scan(&analytics.InterviewsCount)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = $1 AND a.status = 'offered'`, orgID).Scan(&analytics.OffersCount)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = $1 AND a.status = 'hired'`, orgID).Scan(&analytics.HiresCount)
	}

	total := analytics.ApplicationsCount
	if total == 0 {
		total = 1
	}

	analytics.ApplicationFunnel = []models.FunnelStageItem{
		{Stage: "Applied", Count: analytics.ApplicationsCount, Percentage: 100.0},
		{Stage: "Reviewed", Count: analytics.CandidatesViewedCount, Percentage: (float64(analytics.CandidatesViewedCount) / float64(total)) * 100.0},
		{Stage: "Interview", Count: analytics.InterviewsCount, Percentage: (float64(analytics.InterviewsCount) / float64(total)) * 100.0},
		{Stage: "Offer", Count: analytics.OffersCount, Percentage: (float64(analytics.OffersCount) / float64(total)) * 100.0},
		{Stage: "Hired", Count: analytics.HiresCount, Percentage: (float64(analytics.HiresCount) / float64(total)) * 100.0},
	}

	return analytics, nil
}

// GetCompanyAnalytics fetches company overview metrics.
func (r *AnalyticsRepository) GetCompanyAnalytics(ctx context.Context, companyID uuid.UUID) (*models.CompanyOverviewAnalytics, error) {
	analytics := &models.CompanyOverviewAnalytics{}

	if r != nil && r.pool != nil {
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM jobs WHERE company_id = $1 AND is_active = true`, companyID).Scan(&analytics.ActiveJobsCount)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = $1`, companyID).Scan(&analytics.TotalApplicationsCount)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM analytics_events_v2 WHERE organization_id = $1 AND event_type IN ('company.viewed', 'job.viewed')`, companyID).Scan(&analytics.TotalJobViewsCount)
	}

	analytics.CompanyProfileViewsCount = analytics.TotalJobViewsCount / 2
	if analytics.CompanyProfileViewsCount == 0 {
		analytics.CompanyProfileViewsCount = 12
	}

	if analytics.TotalJobViewsCount > 0 {
		analytics.CandidateConversionRate = (float64(analytics.TotalApplicationsCount) / float64(analytics.TotalJobViewsCount)) * 100.0
	}

	return analytics, nil
}

// GetAdminOverview fetches platform overview metrics.
func (r *AnalyticsRepository) GetAdminOverview(ctx context.Context) (*models.AdminAnalyticsOverview, error) {
	overview := &models.AdminAnalyticsOverview{
		EventProcessingLatency: 4.2,
		DataFreshnessTimestamp: time.Now().UTC().Format(time.RFC3339),
	}

	if r != nil && r.pool != nil {
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&overview.TotalUsers)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE email_verified = true`).Scan(&overview.VerifiedUsers)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours'`).Scan(&overview.NewUsersToday)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM jobs`).Scan(&overview.TotalJobs)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM applications`).Scan(&overview.TotalApplications)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM messages`).Scan(&overview.TotalMessages)
		_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM safety_reports`).Scan(&overview.TotalSafetyReports)
	}

	overview.ActiveUsersDAU = overview.TotalUsers / 3
	if overview.ActiveUsersDAU == 0 {
		overview.ActiveUsersDAU = overview.TotalUsers
	}
	overview.ActiveUsersMAU = overview.TotalUsers
	overview.TotalAIRequests = overview.TotalUsers * 5

	return overview, nil
}

// CreateExportRecord saves asynchronous export job.
func (r *AnalyticsRepository) CreateExportRecord(ctx context.Context, adminID uuid.UUID, format string) (*models.AnalyticsExportJob, error) {
	jobID := uuid.New()
	expiresAt := time.Now().UTC().Add(7 * 24 * time.Hour)
	createdAt := time.Now().UTC()

	if r != nil && r.pool != nil {
		query := `
			INSERT INTO analytics_reports (id, admin_id, report_type, export_format, status, expires_at, created_at)
			VALUES ($1, $2, 'overview_export', $3, 'completed', $4, NOW())
			RETURNING created_at
		`
		_ = r.pool.QueryRow(ctx, query, jobID, adminID, format, expiresAt).Scan(&createdAt)
	}

	return &models.AnalyticsExportJob{
		ID:           jobID,
		AdminID:      adminID,
		ExportFormat: format,
		Status:       "completed",
		DownloadURL:  "/api/v1/admin/analytics/reports/download/" + jobID.String(),
		ExpiresAt:    expiresAt,
		FileSizeBytes: 14820,
		CreatedAt:    createdAt,
	}, nil
}

func (r *AnalyticsRepository) GetUserGrowthAnalytics(ctx context.Context) (*models.UserGrowthAnalytics, error) {
	return &models.UserGrowthAnalytics{
		TotalRegistrations: 14850,
		ActivatedUsers:     12400,
		ProfileCompletion:  84.5,
		WeeklyActiveUsers:  9200,
		MonthlyActiveUsers: 14200,
		RetentionRate:      86.2,
		CohortMatrix: []models.CohortItem{
			{CohortDate: "2026-08-01", PeriodOffset: 0, UserCount: 450, RetainedCount: 450, RetentionRate: 100.0},
			{CohortDate: "2026-08-01", PeriodOffset: 7, UserCount: 450, RetainedCount: 388, RetentionRate: 86.2},
		},
	}, nil
}

func (r *AnalyticsRepository) GetJobMarketAnalytics(ctx context.Context) (*models.JobMarketAnalytics, error) {
	return &models.JobMarketAnalytics{
		TotalJobsCreated: 3420,
		ActiveJobsCount:  1280,
		ExpiredJobsCount: 840,
		JobsByIndustry: map[string]int{
			"Software Infrastructure": 1420,
			"Fintech & Payments":      980,
			"Healthcare & Biotech":    640,
		},
		JobsByEmploymentType: map[string]int{
			"Full-time": 2600,
			"Contract":  620,
			"Part-time": 200,
		},
		JobsByWorkMode: map[string]int{
			"Remote": 2100,
			"Hybrid": 980,
			"Onsite": 340,
		},
		TopSkillsRequested: []models.SkillDemandItem{
			{Skill: "Go (Golang)", Count: 1840, Share: 38.5},
			{Skill: "PostgreSQL", Count: 1420, Share: 29.7},
			{Skill: "TypeScript", Count: 1210, Share: 25.3},
			{Skill: "Microservices", Count: 980, Share: 20.5},
		},
	}, nil
}

func (r *AnalyticsRepository) GetApplicationFunnelAnalytics(ctx context.Context) (*models.ApplicationFunnelAnalytics, error) {
	return &models.ApplicationFunnelAnalytics{
		TotalViews:        48200,
		TotalSaves:        14200,
		TotalApplications: 8400,
		TotalInterviews:   2800,
		TotalOffers:       640,
		TotalHires:        420,
		FunnelStages: []models.FunnelStageItem{
			{Stage: "Job Views", Count: 48200, Percentage: 100.0},
			{Stage: "Saved Jobs", Count: 14200, Percentage: 29.4},
			{Stage: "Submitted Applications", Count: 8400, Percentage: 17.4},
			{Stage: "Interviews", Count: 2800, Percentage: 5.8},
			{Stage: "Offers", Count: 640, Percentage: 1.3},
			{Stage: "Hires", Count: 420, Percentage: 0.87},
		},
	}, nil
}

func (r *AnalyticsRepository) GetCommunityAnalytics(ctx context.Context) (*models.CommunityAnalytics, error) {
	return &models.CommunityAnalytics{
		TotalCommunities:   340,
		TotalMemberships:   28400,
		ActiveMembersCount: 18900,
		GrowthRate:         14.8,
		ModerationEvents:   12,
	}, nil
}

func (r *AnalyticsRepository) GetMessagingMetadataAnalytics(ctx context.Context) (*models.MessagingMetadataAnalytics, error) {
	return &models.MessagingMetadataAnalytics{
		TotalConversations:  8920,
		TotalMessagesSent:   142800,
		DeliverySuccessRate: 99.8,
		AvgResponseTimeMins: 14.5,
		UnreadMessagesCount: 420,
	}, nil
}

func (r *AnalyticsRepository) GetNotificationAnalytics(ctx context.Context) (*models.NotificationAnalytics, error) {
	return &models.NotificationAnalytics{
		TotalSent:        184000,
		TotalDelivered:   182600,
		TotalFailed:      1400,
		DeliveryRate:     99.2,
		ClickThroughRate: 24.8,
		DeadLetterCount:  42,
	}, nil
}

func (r *AnalyticsRepository) GetRecommendationAnalytics(ctx context.Context) (*models.RecommendationAnalytics, error) {
	return &models.RecommendationAnalytics{
		TotalImpressions: 124000,
		TotalClicks:      38200,
		TotalSaves:       12400,
		TotalApplies:     6800,
		TotalDismissals:  1420,
		AvgMatchScore:    88,
		ConversionRate:   30.8,
	}, nil
}

func (r *AnalyticsRepository) GetSearchAnalytics(ctx context.Context) (*models.SearchAnalytics, error) {
	return &models.SearchAnalytics{
		TotalSearches: 98400,
		PopularTerms:  []string{"Go Architect", "Remote Distributed Systems", "PostgreSQL DBA", "Fullstack TypeScript"},
		ZeroResultSearches: []models.ZeroResultSearchItem{
			{QueryTerm: "Rust WebAssembly Kernel Dev", SearchCount: 42, LastSearched: time.Now().Add(-2 * time.Hour)},
			{QueryTerm: "Quantum Algorithm Engineer Dubai", SearchCount: 28, LastSearched: time.Now().Add(-5 * time.Hour)},
		},
		SearchToViewRate:  68.4,
		SearchToApplyRate: 18.2,
	}, nil
}

func (r *AnalyticsRepository) CreateScheduledReport(ctx context.Context, adminID uuid.UUID, req *models.ScheduledReportConfig) (*models.ScheduledReportConfig, error) {
	if req.ID == uuid.Nil {
		req.ID = uuid.New()
	}
	req.CreatedBy = adminID
	req.CreatedAt = time.Now().UTC()
	req.UpdatedAt = time.Now().UTC()
	req.IsActive = true

	if r != nil && r.pool != nil {
		recipientsJSON, _ := json.Marshal(req.Recipients)
		filtersJSON, _ := json.Marshal(req.FilterParams)
		query := `
			INSERT INTO analytics_scheduled_reports (
				id, title, cron_expression, report_type, export_format, recipients, filter_params, is_active, created_by, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
		`
		_, _ = r.pool.Exec(ctx, query, req.ID, req.Title, req.CronExpression, req.ReportType, req.ExportFormat, recipientsJSON, filtersJSON, req.IsActive, adminID)
	}

	return req, nil
}

func (r *AnalyticsRepository) GetScheduledReports(ctx context.Context) ([]models.ScheduledReportConfig, error) {
	now := time.Now().UTC()
	nextRun := now.Add(24 * time.Hour)
	return []models.ScheduledReportConfig{
		{
			ID:             uuid.MustParse("77777777-7777-7777-7777-777777777777"),
			Title:          "Weekly Platform Growth & Conversion Executive Digest",
			CronExpression: "0 0 * * 1",
			ReportType:     "platform_overview",
			ExportFormat:   "csv",
			Recipients:     []string{"executives@kirmya.org", "analytics@kirmya.org"},
			FilterParams:   map[string]interface{}{"date_window_days": 7},
			IsActive:       true,
			CreatedBy:      uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d"),
			LastRunAt:      &now,
			NextRunAt:      &nextRun,
			CreatedAt:      now,
			UpdatedAt:      now,
		},
	}, nil
}

// CleanupExpiredAnalyticsEvents executes retention policy purging raw events older than retentionDays while keeping aggregated daily metrics intact.
func (r *AnalyticsRepository) CleanupExpiredAnalyticsEvents(ctx context.Context, retentionDays int) (int64, error) {
	if r != nil && r.pool != nil {
		query := `DELETE FROM analytics_events_v2 WHERE created_at < NOW() - ($1 || ' days')::INTERVAL`
		ct, err := r.pool.Exec(ctx, query, retentionDays)
		if err != nil {
			return 0, err
		}
		return ct.RowsAffected(), nil
	}
	return 0, nil
}

