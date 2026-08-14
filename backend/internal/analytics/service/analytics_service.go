package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"kirmya/internal/analytics/models"
	"kirmya/internal/analytics/repository"
)

var (
	ErrUnauthorizedOrgAccess = errors.New("unauthorized organization analytics access")
	ErrInvalidEventType      = errors.New("event_type is required")
)

const MinPrivacyThreshold = 5 // Privacy Threshold: Do not display analytics for groups smaller than 5 to prevent individual re-identification.

type AnalyticsService struct {
	repo *repository.AnalyticsRepository
}

func NewAnalyticsService(repo *repository.AnalyticsRepository) *AnalyticsService {
	return &AnalyticsService{repo: repo}
}

// IngestEvent processes versioned event ingestion asynchronously and idempotently.
func (s *AnalyticsService) IngestEvent(ctx context.Context, req *models.IngestEventRequest) (*models.IngestedEvent, error) {
	if req.EventType == "" {
		return nil, ErrInvalidEventType
	}

	event, err := s.repo.IngestEvent(ctx, req)
	if err != nil {
		if event != nil {
			_ = s.repo.LogEventFailure(ctx, event.ID, req.EventType, err.Error())
		}
		return nil, err
	}

	return event, nil
}

// GetUserAnalytics retrieves personal user metrics.
func (s *AnalyticsService) GetUserAnalytics(ctx context.Context, userID uuid.UUID) (*models.UserPersonalAnalytics, error) {
	return s.repo.GetUserAnalytics(ctx, userID)
}

// GetRecruiterAnalytics retrieves recruiter workspace metrics for authorized organization.
func (s *AnalyticsService) GetRecruiterAnalytics(ctx context.Context, orgID uuid.UUID, requestingUserID uuid.UUID) (*models.RecruiterHiringAnalytics, error) {
	if orgID == uuid.Nil {
		return nil, ErrUnauthorizedOrgAccess
	}
	return s.repo.GetRecruiterAnalytics(ctx, orgID)
}

// GetCompanyAnalytics retrieves company overview metrics.
func (s *AnalyticsService) GetCompanyAnalytics(ctx context.Context, companyID uuid.UUID) (*models.CompanyOverviewAnalytics, error) {
	if companyID == uuid.Nil {
		return nil, ErrUnauthorizedOrgAccess
	}
	analytics, err := s.repo.GetCompanyAnalytics(ctx, companyID)
	if err != nil {
		return nil, err
	}

	// Apply privacy threshold safeguards
	if analytics.TotalApplicationsCount > 0 && analytics.TotalApplicationsCount < MinPrivacyThreshold {
		analytics.TotalApplicationsCount = MinPrivacyThreshold
	}

	return analytics, nil
}

// GetAdminOverview retrieves overall platform metrics for administrators.
func (s *AnalyticsService) GetAdminOverview(ctx context.Context) (*models.AdminAnalyticsOverview, error) {
	return s.repo.GetAdminOverview(ctx)
}

// RequestExport triggers asynchronous data export.
func (s *AnalyticsService) RequestExport(ctx context.Context, adminID uuid.UUID, format string) (*models.AnalyticsExportJob, error) {
	if format == "" {
		format = "csv"
	}
	return s.repo.CreateExportRecord(ctx, adminID, format)
}

func (s *AnalyticsService) GetUserGrowthAnalytics(ctx context.Context) (*models.UserGrowthAnalytics, error) {
	return s.repo.GetUserGrowthAnalytics(ctx)
}

func (s *AnalyticsService) GetJobMarketAnalytics(ctx context.Context) (*models.JobMarketAnalytics, error) {
	return s.repo.GetJobMarketAnalytics(ctx)
}

func (s *AnalyticsService) GetApplicationFunnelAnalytics(ctx context.Context) (*models.ApplicationFunnelAnalytics, error) {
	return s.repo.GetApplicationFunnelAnalytics(ctx)
}

func (s *AnalyticsService) GetCommunityAnalytics(ctx context.Context) (*models.CommunityAnalytics, error) {
	return s.repo.GetCommunityAnalytics(ctx)
}

func (s *AnalyticsService) GetMessagingMetadataAnalytics(ctx context.Context) (*models.MessagingMetadataAnalytics, error) {
	return s.repo.GetMessagingMetadataAnalytics(ctx)
}

func (s *AnalyticsService) GetNotificationAnalytics(ctx context.Context) (*models.NotificationAnalytics, error) {
	return s.repo.GetNotificationAnalytics(ctx)
}

func (s *AnalyticsService) GetRecommendationAnalytics(ctx context.Context) (*models.RecommendationAnalytics, error) {
	return s.repo.GetRecommendationAnalytics(ctx)
}

func (s *AnalyticsService) GetSearchAnalytics(ctx context.Context) (*models.SearchAnalytics, error) {
	return s.repo.GetSearchAnalytics(ctx)
}

func (s *AnalyticsService) CreateScheduledReport(ctx context.Context, adminID uuid.UUID, req *models.ScheduledReportConfig) (*models.ScheduledReportConfig, error) {
	return s.repo.CreateScheduledReport(ctx, adminID, req)
}

func (s *AnalyticsService) GetScheduledReports(ctx context.Context) ([]models.ScheduledReportConfig, error) {
	return s.repo.GetScheduledReports(ctx)
}

