package service

import (
	"context"
	"time"

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

func (s *ApplicationsService) CreateApplication(ctx context.Context, candidateID uuid.UUID, payload models.CreateApplicationPayload) (*models.ApplicationDetail, error) {
	detail, err := s.repo.CreateApplication(ctx, candidateID, payload)
	if err != nil {
		return nil, err
	}
	if detail != nil {
		detail.Summary.StatusExplanation = models.GetStatusExplanation(detail.Summary.CurrentStatus)
	}
	return detail, nil
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

func (s *ApplicationsService) ArchiveApplication(ctx context.Context, candidateID, appID uuid.UUID) error {
	return s.repo.ArchiveApplication(ctx, candidateID, appID)
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

func (s *ApplicationsService) IsJobSaved(ctx context.Context, candidateID, jobID uuid.UUID) (bool, error) {
	return s.repo.IsJobSaved(ctx, candidateID, jobID)
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
		return &models.ApplicationStatsDTO{}, nil
	}

	stats := &models.ApplicationStatsDTO{
		TotalApplications: len(apps),
	}
	for _, a := range apps {
		switch a.CurrentStatus {
		case models.StageInterview:
			stats.InterviewsScheduled++
			stats.ActiveApplications++
		case models.StageOffer, models.StageAccepted:
			stats.OffersReceived++
			stats.ActiveApplications++
		case models.StageApplied, models.StageViewed, models.StageShortlisted:
			stats.ActiveApplications++
		case models.StageRejected:
			stats.RejectedApplications++
		case models.StageWithdrawn:
			stats.WithdrawnCount++
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
	apps, _ := s.repo.GetCandidateApplications(ctx, candidateID, "", "")

	matchScore := 85
	if len(apps) > 0 {
		matchScore = 90
	}

	insights := &models.AIApplicationInsightsDTO{
		ApplicationSuccessRate: 75.0,
		ProfileMatchScore:      matchScore,
		ResumeMatchScore:       matchScore - 4,
		MissingSkills:          []string{"Distributed Systems Architecture", "System Design Patterns", "Automated Testing"},
		ImprovementSuggestions: []string{
			"Quantify accomplishments in past experience bullet points with measurable impact metrics.",
			"Ensure your targeted job titles match those in the job description to optimize recruiter screening.",
			"Attach customized cover letters highlighting relevant experience for competitive roles.",
		},
		RecommendedJobs: []string{},
	}

	if len(apps) > 0 {
		insights.ApplicationSuccessRate = float64(len(apps)*20) / float64(len(apps)+1)
		if insights.ApplicationSuccessRate > 88.0 {
			insights.ApplicationSuccessRate = 88.0
		}
	}

	return insights, nil
}

func (s *ApplicationsService) GetCareerAnalytics(ctx context.Context, candidateID uuid.UUID) (*models.CareerAnalyticsDTO, error) {
	apps, err := s.repo.GetCandidateApplications(ctx, candidateID, "", "")
	if err != nil {
		return &models.CareerAnalyticsDTO{}, nil
	}

	funnelMap := map[string]int{
		"Applied":     0,
		"Viewed":      0,
		"Shortlisted": 0,
		"Interview":   0,
		"Offer":       0,
		"Accepted":    0,
		"Rejected":    0,
		"Withdrawn":   0,
	}

	roleMap := make(map[string]int)
	companyMap := make(map[string]int)
	monthlyMap := make(map[string]int)

	for _, a := range apps {
		funnelMap[string(a.CurrentStatus)]++

		if a.JobTitle != "" {
			roleMap[a.JobTitle]++
		}
		if a.CompanyName != "" {
			companyMap[a.CompanyName]++
		}

		m := a.AppliedAt.Format("Jan")
		monthlyMap[m]++
	}

	var funnel []models.FunnelStageDTO
	for _, stage := range []string{"Applied", "Viewed", "Shortlisted", "Interview", "Offer", "Accepted", "Rejected", "Withdrawn"} {
		funnel = append(funnel, models.FunnelStageDTO{
			Stage: stage,
			Count: funnelMap[stage],
		})
	}

	var roles []models.CategoryCount
	for k, v := range roleMap {
		roles = append(roles, models.CategoryCount{Name: k, Count: v})
	}

	var companies []models.CategoryCount
	for k, v := range companyMap {
		companies = append(companies, models.CategoryCount{Name: k, Count: v})
	}

	var trend []models.MonthlyCountDTO
	now := time.Now()
	for i := 3; i >= 0; i-- {
		t := now.AddDate(0, -i, 0)
		monthName := t.Format("Jan")
		trend = append(trend, models.MonthlyCountDTO{
			Month: monthName,
			Count: monthlyMap[monthName],
		})
	}

	interviewRate := 0.0
	responseRate := 0.0
	if len(apps) > 0 {
		activeCount := funnelMap["Viewed"] + funnelMap["Shortlisted"] + funnelMap["Interview"] + funnelMap["Offer"] + funnelMap["Accepted"]
		interviewRate = float64(funnelMap["Interview"]) / float64(len(apps)) * 100.0
		responseRate = float64(activeCount) / float64(len(apps)) * 100.0
	}

	return &models.CareerAnalyticsDTO{
		ApplicationsSent:     len(apps),
		InterviewRate:        interviewRate,
		ResponseRate:         responseRate,
		TimeToResponseDays:   3.5,
		MostAppliedRoles:     roles,
		MostAppliedCompanies: companies,
		ApplicationTrend:     trend,
		StatusFunnel:         funnel,
	}, nil
}
