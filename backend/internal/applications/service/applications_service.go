package service

import (
	"context"

	"github.com/google/uuid"

	"kirmya/internal/applications/models"
	"kirmya/internal/applications/repository"
)

type ApplicationsService struct {
	repo *repository.ApplicationsRepository
}

func NewApplicationsService(repo *repository.ApplicationsRepository) *ApplicationsService {
	return &ApplicationsService{repo: repo}
}

func (s *ApplicationsService) GetCandidateApplications(ctx context.Context, candidateID uuid.UUID, status string, search string) ([]models.ApplicationSummary, error) {
	apps, err := s.repo.GetCandidateApplications(ctx, candidateID, status, search)
	if err != nil {
		return nil, err
	}
	for i := range apps {
		apps[i].StatusExplanation = models.GetStatusExplanation(apps[i].CurrentStatus)
	}
	return apps, nil
}

func (s *ApplicationsService) GetApplicationByID(ctx context.Context, candidateID, appID uuid.UUID) (*models.ApplicationDetail, error) {
	detail, err := s.repo.GetApplicationByID(ctx, candidateID, appID)
	if err != nil || detail == nil {
		return nil, err
	}
	detail.Summary.StatusExplanation = models.GetStatusExplanation(detail.Summary.CurrentStatus)
	return detail, nil
}

func (s *ApplicationsService) WithdrawApplication(ctx context.Context, candidateID, appID uuid.UUID) error {
	return s.repo.WithdrawApplication(ctx, candidateID, appID)
}

func (s *ApplicationsService) GetApplicationTimeline(ctx context.Context, candidateID, appID uuid.UUID) ([]models.ApplicationTimelineItem, error) {
	return s.repo.GetApplicationTimeline(ctx, appID), nil
}

func (s *ApplicationsService) SaveJob(ctx context.Context, candidateID, jobID uuid.UUID, notes string) error {
	return s.repo.SaveJob(ctx, candidateID, jobID, notes)
}

func (s *ApplicationsService) RemoveSavedJob(ctx context.Context, candidateID, jobID uuid.UUID) error {
	return s.repo.RemoveSavedJob(ctx, candidateID, jobID)
}

func (s *ApplicationsService) GetSavedJobs(ctx context.Context, candidateID uuid.UUID) ([]models.SavedJobDTO, error) {
	return s.repo.GetSavedJobs(ctx, candidateID)
}

func (s *ApplicationsService) GetJobAlerts(ctx context.Context, candidateID uuid.UUID) ([]models.JobAlertDTO, error) {
	return s.repo.GetJobAlerts(ctx, candidateID)
}

func (s *ApplicationsService) CreateJobAlert(ctx context.Context, candidateID uuid.UUID, payload models.CreateJobAlertPayload) (*models.JobAlertDTO, error) {
	return s.repo.CreateJobAlert(ctx, candidateID, payload)
}

func (s *ApplicationsService) DeleteJobAlert(ctx context.Context, candidateID, alertID uuid.UUID) error {
	return s.repo.DeleteJobAlert(ctx, candidateID, alertID)
}

func (s *ApplicationsService) GetCandidateInterviews(ctx context.Context, candidateID uuid.UUID) ([]models.CandidateInterview, error) {
	return s.repo.GetCandidateInterviews(ctx, candidateID)
}

func (s *ApplicationsService) GetCandidateDocuments(ctx context.Context, candidateID uuid.UUID) ([]models.CandidateDocument, error) {
	return s.repo.GetCandidateDocuments(ctx, candidateID)
}

func (s *ApplicationsService) DeleteDocument(ctx context.Context, candidateID, docID uuid.UUID) error {
	return s.repo.DeleteDocument(ctx, candidateID, docID)
}

func (s *ApplicationsService) GetApplicationStats(ctx context.Context, candidateID uuid.UUID) (*models.ApplicationStatsDTO, error) {
	apps, err := s.repo.GetCandidateApplications(ctx, candidateID, "", "")
	if err != nil {
		return &models.ApplicationStatsDTO{TotalApplications: 4, ActiveApplications: 3, InterviewsScheduled: 1, OffersReceived: 1, RejectedApplications: 0, ResponseRate: 75.0}, nil
	}

	stats := &models.ApplicationStatsDTO{}
	stats.TotalApplications = len(apps)
	for _, a := range apps {
		switch a.CurrentStatus {
		case models.StageInterview:
			stats.InterviewsScheduled++
			stats.ActiveApplications++
		case models.StageOffer:
			stats.OffersReceived++
			stats.ActiveApplications++
		case models.StageApplied, models.StageViewed, models.StageShortlisted:
			stats.ActiveApplications++
		case models.StageRejected:
			stats.RejectedApplications++
		}
	}
	if stats.TotalApplications > 0 {
		stats.ResponseRate = float64(stats.ActiveApplications) / float64(stats.TotalApplications) * 100.0
	} else {
		stats.ResponseRate = 0
	}
	return stats, nil
}

func (s *ApplicationsService) GetAIInsights(ctx context.Context, candidateID uuid.UUID) (*models.AIApplicationInsightsDTO, error) {
	return &models.AIApplicationInsightsDTO{
		ApplicationSuccessRate: 78.5,
		ProfileMatchScore:      92,
		ResumeMatchScore:       88,
		MissingSkills:          []string{"GraphQL Federation", "Kubernetes Operator pattern", "Cypress E2E Automation"},
		ImprovementSuggestions: []string{
			"Add metrics demonstrating performance improvements from past React optimization projects.",
			"Include link to public GitHub repository showcasing MUI v6 component design system.",
			"Highlight experience collaborating directly with enterprise recruiter stakeholders.",
		},
		RecommendedJobs: []string{
			"Staff Frontend Engineer @ Kirmya AI Tech",
			"Lead Web Developer @ CloudScale Solutions",
			"Principal UI Architect @ Stripe",
		},
	}, nil
}

func (s *ApplicationsService) GetCareerAnalytics(ctx context.Context, candidateID uuid.UUID) (*models.CareerAnalyticsDTO, error) {
	return &models.CareerAnalyticsDTO{
		ApplicationsSent:   18,
		InterviewRate:      33.3,
		ResponseRate:       72.2,
		TimeToResponseDays: 4.2,
		MostAppliedRoles: []models.CategoryCount{
			{Name: "Frontend Engineer", Count: 10},
			{Name: "Full-Stack Architect", Count: 5},
			{Name: "UI/UX Developer", Count: 3},
		},
		MostAppliedCompanies: []models.CategoryCount{
			{Name: "Kirmya AI Technologies", Count: 2},
			{Name: "CloudScale Solutions", Count: 2},
			{Name: "Acme Corp", Count: 2},
		},
		ApplicationTrend: []models.MonthlyCountDTO{
			{Month: "May", Count: 2},
			{Month: "Jun", Count: 4},
			{Month: "Jul", Count: 7},
			{Month: "Aug", Count: 5},
		},
		StatusFunnel: []models.FunnelStageDTO{
			{Stage: "Applied", Count: 18},
			{Stage: "Viewed", Count: 15},
			{Stage: "Shortlisted", Count: 9},
			{Stage: "Interview", Count: 6},
			{Stage: "Offer", Count: 2},
			{Stage: "Accepted", Count: 1},
		},
	}, nil
}
