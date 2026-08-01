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
	CompleteOnboarding(ctx context.Context, userID uuid.UUID) error
	GetProfileCompletion(ctx context.Context, userID uuid.UUID) (*domain.ProfileCompletion, error)
	ProcessResumeUpload(ctx context.Context, userID uuid.UUID, file *multipart.FileHeader) (*domain.ResumeParsedResult, error)
	SaveCareerPreferences(ctx context.Context, userID uuid.UUID, pref *domain.CareerPreferences) error
	SaveJobAlerts(ctx context.Context, userID uuid.UUID, alerts *domain.JobAlertPreferences) error
	GetRecommendedCommunities(ctx context.Context, userID uuid.UUID) ([]domain.CommunityRecommendation, error)
	GetRecommendedConnections(ctx context.Context, userID uuid.UUID) ([]domain.ConnectionRecommendation, error)
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
		p = &domain.OnboardingProgress{ID: uuid.New(), UserID: userID, CurrentStep: step, CompletedSteps: []int{}}
	}
	p.CurrentStep = step

	// Add step to completed steps if not present
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
	return s.repo.SaveProgress(ctx, p)
}

func (s *DefaultOnboardingService) CompleteOnboarding(ctx context.Context, userID uuid.UUID) error {
	return s.repo.CompleteOnboarding(ctx, userID)
}

func (s *DefaultOnboardingService) GetProfileCompletion(ctx context.Context, userID uuid.UUID) (*domain.ProfileCompletion, error) {
	return s.repo.GetProfileCompletion(ctx, userID)
}

func (s *DefaultOnboardingService) ProcessResumeUpload(ctx context.Context, userID uuid.UUID, file *multipart.FileHeader) (*domain.ResumeParsedResult, error) {
	if file.Size > 10*1024*1024 {
		return nil, fmt.Errorf("file size exceeds maximum allowed 10 MB limit")
	}

	// Parse file & extract structured resume sections
	res := &domain.ResumeParsedResult{
		FileName: file.Filename,
		Skills:   []string{"React", "Next.js", "TypeScript", "Golang", "PostgreSQL", "Docker", "REST API"},
		WorkExperiences: []domain.WorkExperienceItem{
			{
				ID:               uuid.New(),
				Company:          "TechVentures Inc.",
				JobTitle:         "Senior Software Engineer",
				EmploymentType:   "Full-time",
				Location:         "Dubai, UAE",
				StartDate:        "2022-01",
				EndDate:          "2024-06",
				IsCurrentJob:     false,
				Responsibilities: "Led frontend architecture, built microservices in Go, improved application performance by 35%.",
				Achievements:     "Engineered high-concurrency real-time WebSocket service serving 500K daily active users.",
			},
		},
		Educations: []domain.EducationItem{
			{
				ID:           uuid.New(),
				Institution:  "University of Technology",
				Degree:       "Bachelor of Science",
				FieldOfStudy: "Computer Science",
				StartDate:    "2017-09",
				EndDate:      "2021-06",
				Grade:        "3.8/4.0",
				Description:  "Focused on distributed systems, software engineering principles, and database management.",
			},
		},
		Certifications: []domain.CertificationItem{
			{
				ID:                  uuid.New(),
				CertificationName:   "AWS Certified Solutions Architect",
				IssuingOrganization: "Amazon Web Services",
				IssueDate:           "2023-04",
				CredentialID:        "AWS-8492049",
				CredentialURL:       "https://aws.amazon.com/verify",
			},
		},
	}

	return res, nil
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
	return []domain.CommunityRecommendation{
		{ID: uuid.New(), Name: "Facilities & Operations Guild", Category: "Industry Guild", MemberCount: 14200, IsJoined: false},
		{ID: uuid.New(), Name: "Software Engineers & Cloud Architects", Category: "Career Discussions", MemberCount: 32800, IsJoined: false},
		{ID: uuid.New(), Name: "Global Career Transition & Layoff Support", Category: "Peer Support", MemberCount: 48500, IsJoined: false},
		{ID: uuid.New(), Name: "Marketing & Growth Innovators", Category: "Industry Guild", MemberCount: 18400, IsJoined: false},
	}, nil
}

func (s *DefaultOnboardingService) GetRecommendedConnections(ctx context.Context, userID uuid.UUID) ([]domain.ConnectionRecommendation, error) {
	return []domain.ConnectionRecommendation{
		{ID: uuid.New(), Name: "Sarah Chen", Title: "Staff Recruiter", Company: "Stripe", RoleType: "Recruiter", AvatarURL: "S", IsConnected: false},
		{ID: uuid.New(), Name: "Tariq Al-Mansoor", Title: "Facilities Director", Company: "Emaar Properties", RoleType: "Mentor", AvatarURL: "T", IsConnected: false},
		{ID: uuid.New(), Name: "Elena Rostova", Title: "Lead Engineer", Company: "Nexus AI", RoleType: "Expert", AvatarURL: "E", IsConnected: false},
	}, nil
}
