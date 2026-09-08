package service

import (
	"context"
	"fmt"
	"mime/multipart"

	"kirmya/internal/onboarding/domain"
	"kirmya/internal/onboarding/repository"

	"github.com/google/uuid"
)

type OnboardingService interface {
	GetProgress(ctx context.Context, userID uuid.UUID) (*domain.OnboardingProgress, error)
	SaveStep(ctx context.Context, userID uuid.UUID, step int) error
	SkipStep(ctx context.Context, userID uuid.UUID, step int) error
	CompleteOnboarding(ctx context.Context, userID uuid.UUID) error
	GetProfileCompletion(ctx context.Context, userID uuid.UUID) (*domain.ProfileCompletion, error)
	ProcessResumeUpload(ctx context.Context, userID uuid.UUID, file *multipart.FileHeader) (*domain.ResumeParsedResult, error)
	SaveCareerPreferences(ctx context.Context, userID uuid.UUID, pref *domain.CareerPreferences) error
	SaveJobAlerts(ctx context.Context, userID uuid.UUID, alerts *domain.JobAlertPreferences) error
	GetRecommendedCommunities(ctx context.Context, userID uuid.UUID) ([]domain.CommunityRecommendation, error)
	GetRecommendedConnections(ctx context.Context, userID uuid.UUID) ([]domain.ConnectionRecommendation, error)

	GetStepConfigs(ctx context.Context) ([]domain.OnboardingStepConfig, error)
	UpdateStepConfigs(ctx context.Context, configs []domain.OnboardingStepConfig) error
	GetAnalyticsSummary(ctx context.Context) (*domain.OnboardingAnalyticsSummary, error)
	SaveRecruiterOnboarding(ctx context.Context, userID uuid.UUID, payload *domain.RecruiterOnboardingPayload) error
	SaveEmployerOnboarding(ctx context.Context, userID uuid.UUID, payload *domain.EmployerOnboardingPayload) error
}

type DefaultOnboardingService struct {
	repo repository.OnboardingRepository
}

func NewOnboardingService(repo repository.OnboardingRepository) OnboardingService {
	return &DefaultOnboardingService{repo: repo}
}

func (s *DefaultOnboardingService) GetProgress(ctx context.Context, userID uuid.UUID) (*domain.OnboardingProgress, error) {
	return s.repo.GetProgress(ctx, userID)
}

func (s *DefaultOnboardingService) SaveStep(ctx context.Context, userID uuid.UUID, step int) error {
	p, err := s.repo.GetProgress(ctx, userID)
	if err != nil {
		p = &domain.OnboardingProgress{ID: uuid.New(), UserID: userID, CurrentStep: step, CompletedSteps: []int{}, SkippedSteps: []int{}}
	}
	p.CurrentStep = step

	already := false
	for _, st := range p.CompletedSteps {
		if st == step {
			already = true
			break
		}
	}
	if !already {
		p.CompletedSteps = append(p.CompletedSteps, step)
	}

	if step >= 15 {
		p.IsCompleted = true
	}
	_ = s.repo.LogAnalyticsEvent(ctx, &userID, "onboarding.step_completed", step, fmt.Sprintf("step_%d", step), nil)
	return s.repo.SaveProgress(ctx, p)
}

func (s *DefaultOnboardingService) SkipStep(ctx context.Context, userID uuid.UUID, step int) error {
	_ = s.repo.LogAnalyticsEvent(ctx, &userID, "onboarding.step_skipped", step, fmt.Sprintf("step_%d", step), nil)
	return s.repo.SkipStep(ctx, userID, step)
}

func (s *DefaultOnboardingService) CompleteOnboarding(ctx context.Context, userID uuid.UUID) error {
	_ = s.repo.LogAnalyticsEvent(ctx, &userID, "onboarding.completed", 15, "completion", nil)
	return s.repo.CompleteOnboarding(ctx, userID)
}

func (s *DefaultOnboardingService) GetProfileCompletion(ctx context.Context, userID uuid.UUID) (*domain.ProfileCompletion, error) {
	return s.repo.GetProfileCompletion(ctx, userID)
}

func (s *DefaultOnboardingService) ProcessResumeUpload(ctx context.Context, userID uuid.UUID, file *multipart.FileHeader) (*domain.ResumeParsedResult, error) {
	if file.Size > 10*1024*1024 {
		return nil, fmt.Errorf("file size exceeds maximum allowed 10 MB limit")
	}

	// No parser runs here. This used to answer every upload with the same
	// fabricated career - seven skills, a Senior Software Engineer post at
	// "TechVentures Inc.", a degree and an AWS credential number - presented to
	// the user as what their own resume said, one click from being saved to
	// their profile. The upload is accepted; the fields stay empty for the user
	// to fill until an extraction step actually exists.
	return &domain.ResumeParsedResult{
		FileName:        file.Filename,
		Skills:          []string{},
		WorkExperiences: []domain.WorkExperienceItem{},
		Educations:      []domain.EducationItem{},
		Certifications:  []domain.CertificationItem{},
	}, nil
}

func (s *DefaultOnboardingService) SaveCareerPreferences(ctx context.Context, userID uuid.UUID, pref *domain.CareerPreferences) error {
	pref.UserID = userID
	return s.repo.SaveCareerPreferences(ctx, pref)
}

func (s *DefaultOnboardingService) SaveJobAlerts(ctx context.Context, userID uuid.UUID, alerts *domain.JobAlertPreferences) error {
	alerts.UserID = userID
	return s.repo.SaveJobAlerts(ctx, alerts)
}

func (s *DefaultOnboardingService) GetRecommendedCommunities(ctx context.Context, userID uuid.UUID) ([]domain.CommunityRecommendation, error) {
	// Real public communities, most members first. The four this replaces did
	// not exist, and each carried a membership count.
	return s.repo.PopularCommunities(ctx, 6)
}

func (s *DefaultOnboardingService) GetRecommendedConnections(ctx context.Context, userID uuid.UUID) ([]domain.ConnectionRecommendation, error) {
	// Real members. The three this replaces were fictional people presented as
	// staff at Stripe, Emaar Properties and Nexus AI.
	return s.repo.SuggestedConnections(ctx, userID, 6)
}

func (s *DefaultOnboardingService) GetStepConfigs(ctx context.Context) ([]domain.OnboardingStepConfig, error) {
	return s.repo.GetStepConfigs(ctx)
}

func (s *DefaultOnboardingService) UpdateStepConfigs(ctx context.Context, configs []domain.OnboardingStepConfig) error {
	return s.repo.UpdateStepConfigs(ctx, configs)
}

func (s *DefaultOnboardingService) GetAnalyticsSummary(ctx context.Context) (*domain.OnboardingAnalyticsSummary, error) {
	return s.repo.GetAnalyticsSummary(ctx)
}

func (s *DefaultOnboardingService) SaveRecruiterOnboarding(ctx context.Context, userID uuid.UUID, payload *domain.RecruiterOnboardingPayload) error {
	return s.repo.SaveRecruiterOnboarding(ctx, userID, payload)
}

func (s *DefaultOnboardingService) SaveEmployerOnboarding(ctx context.Context, userID uuid.UUID, payload *domain.EmployerOnboardingPayload) error {
	return s.repo.SaveEmployerOnboarding(ctx, userID, payload)
}
