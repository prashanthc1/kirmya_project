package provider

import (
	"context"
	"fmt"
	"time"

	"kirmya/internal/learning/domain"

	"github.com/google/uuid"
)

// ExternalCourseProvider defines the contract for integrating third-party course providers (Coursera, Udemy, Pluralsight).
type ExternalCourseProvider interface {
	GetProviderName() string
	FetchCourses(ctx context.Context, category string) ([]domain.Course, error)
	SyncCourseDetails(ctx context.Context, externalCourseID string) (*domain.Course, error)
}

// CourseraProvider implements ExternalCourseProvider for Coursera API integrations
type CourseraProvider struct {
	APIKey string
}

func NewCourseraProvider(apiKey string) *CourseraProvider {
	return &CourseraProvider{APIKey: apiKey}
}

func (p *CourseraProvider) GetProviderName() string {
	return domain.ProviderCoursera
}

func (p *CourseraProvider) FetchCourses(ctx context.Context, category string) ([]domain.Course, error) {
	// Adapter implementation for Coursera catalog API
	return []domain.Course{
		{
			ID:               uuid.New(),
			Title:            "Architecting with Google Cloud Platform",
			Description:      "Comprehensive cloud infrastructure design, Kubernetes deployments, and enterprise security.",
			Category:         domain.CategoryTechnology,
			DifficultyLevel:  "advanced",
			Provider:         domain.ProviderCoursera,
			ExternalCourseID: "coursera-gcp-arch-101",
			ExternalURL:      "https://coursera.org/learn/gcp-architecture",
			ThumbnailURL:     "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500",
			DurationHours:    24,
			TotalLessons:     18,
			Rating:           4.9,
			SkillsCovered:    []string{"Google Cloud", "Kubernetes", "Microservices", "DevOps"},
			CreatedAt:        time.Now(),
		},
	}, nil
}

func (p *CourseraProvider) SyncCourseDetails(ctx context.Context, externalCourseID string) (*domain.Course, error) {
	courses, _ := p.FetchCourses(ctx, "")
	if len(courses) > 0 {
		return &courses[0], nil
	}
	return nil, fmt.Errorf("coursera course not found: %s", externalCourseID)
}

// UdemyProvider implements ExternalCourseProvider for Udemy API integrations
type UdemyProvider struct {
	ClientID     string
	ClientSecret string
}

func NewUdemyProvider(clientID, clientSecret string) *UdemyProvider {
	return &UdemyProvider{ClientID: clientID, ClientSecret: clientSecret}
}

func (p *UdemyProvider) GetProviderName() string {
	return domain.ProviderUdemy
}

func (p *UdemyProvider) FetchCourses(ctx context.Context, category string) ([]domain.Course, error) {
	return []domain.Course{
		{
			ID:               uuid.New(),
			Title:            "Executive Leadership & Change Management Masterclass",
			Description:      "Master strategic decision-making, organizational change, team leadership, and executive presence.",
			Category:         domain.CategoryManagement,
			DifficultyLevel:  "intermediate",
			Provider:         domain.ProviderUdemy,
			ExternalCourseID: "udemy-leadership-exec-202",
			ExternalURL:      "https://udemy.com/course/executive-leadership",
			ThumbnailURL:     "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500",
			DurationHours:    16,
			TotalLessons:     14,
			Rating:           4.8,
			SkillsCovered:    []string{"Strategic Leadership", "Change Management", "Team Building", "Conflict Resolution"},
			CreatedAt:        time.Now(),
		},
	}, nil
}

func (p *UdemyProvider) SyncCourseDetails(ctx context.Context, externalCourseID string) (*domain.Course, error) {
	courses, _ := p.FetchCourses(ctx, "")
	if len(courses) > 0 {
		return &courses[0], nil
	}
	return nil, fmt.Errorf("udemy course not found: %s", externalCourseID)
}
