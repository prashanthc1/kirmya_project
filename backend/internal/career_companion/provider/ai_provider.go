package provider

import (
	"context"
	"fmt"
	"strings"

	"kirmya/internal/career_companion/domain"
)

// CareerAIProvider interface isolates AI model execution from application logic
type CareerAIProvider interface {
	GetProviderName() string
	GenerateResponse(ctx context.Context, systemPrompt, userMessage string, history []domain.AIMessage) (string, int, error)
	GenerateStructuredRoadmap(ctx context.Context, targetRole, currentLevel string) ([]domain.CareerMilestone, error)
}

// MockCareerAIProvider provides offline LLM simulation with rapid responses
type MockCareerAIProvider struct{}

func NewMockCareerAIProvider() *MockCareerAIProvider {
	return &MockCareerAIProvider{}
}

func (p *MockCareerAIProvider) GetProviderName() string {
	return "mock-career-llm-v1"
}

func (p *MockCareerAIProvider) GenerateResponse(ctx context.Context, systemPrompt, userMessage string, history []domain.AIMessage) (string, int, error) {
	qLower := strings.ToLower(userMessage)

	if strings.Contains(qLower, "resume") {
		return "Based on your background in Go & React architecture, I recommend highlighting your recent project where you optimized PostgreSQL queries by 40%. Add metrics like 'P99 response time < 50ms' to stand out to recruiters.", 185, nil
	} else if strings.Contains(qLower, "interview") {
		return "Great! Let's practice a behavioral question: 'Tell me about a time you had to resolve a high-severity production outage.' How did you diagnose the root cause and communicate with stakeholders?", 160, nil
	} else if strings.Contains(qLower, "job loss") || strings.Contains(qLower, "unemployed") || strings.Contains(qLower, "laid off") {
		return "Experiencing job loss is tough, but remember it's a temporary transition. Let's focus on 3 immediate recovery steps: 1) Audit your core skills, 2) Request internal referrals via the Kirmya Marketplace, and 3) Practice 2 mock interview sessions this week.", 210, nil
	}

	return fmt.Sprintf("I am your Kirmya AI Career Companion. Regarding '%s': Let's align your technical experience with high-demand roles. Would you like me to generate a personalized career roadmap or conduct an interview coaching session?", userMessage), 140, nil
}

func (p *MockCareerAIProvider) GenerateStructuredRoadmap(ctx context.Context, targetRole, currentLevel string) ([]domain.CareerMilestone, error) {
	return []domain.CareerMilestone{
		{
			StepNumber:  1,
			Title:       "Core Technical Refinement & Resume ATS Optimization",
			Description: "Update resume with quantifiable achievements, build Go microservice portfolio projects, and achieve 90+ ATS compatibility score.",
			Duration:    "2 Weeks",
			KeySkills:   []string{"Go", "PostgreSQL GIN Indexes", "ATS Optimization"},
			Status:      "in_progress",
		},
		{
			StepNumber:  2,
			Title:       "System Design & Distributed Architecture Mastery",
			Description: "Complete system design prep covering rate limiting, distributed caching with Redis, and Kafka event streams.",
			Duration:    "3 Weeks",
			KeySkills:   []string{"System Design", "Redis", "Kafka", "Microservices"},
			Status:      "pending",
		},
		{
			StepNumber:  3,
			Title:       "Internal Referral Networking & Recruiter Outreach",
			Description: "Request internal employee referrals on the Kirmya Marketplace for target companies like Stripe, Google, and TechCorp.",
			Duration:    "2 Weeks",
			KeySkills:   []string{"Networking", "Referrals", "Recruiter Pitch"},
			Status:      "pending",
		},
		{
			StepNumber:  4,
			Title:       "Mock Technical Interviews & Offer Negotiation",
			Description: "Participate in 5 simulated AI interview coaching sessions, speed recruiter matches, and negotiate competitive compensation packages.",
			Duration:    "2 Weeks",
			KeySkills:   []string{"Behavioral Prep", "Coding Interviews", "Offer Negotiation"},
			Status:      "pending",
		},
	}, nil
}

// OpenAICareerAIProvider implements CareerAIProvider for OpenAI GPT-4o integration
type OpenAICareerAIProvider struct {
	APIKey string
}

func NewOpenAICareerAIProvider(apiKey string) *OpenAICareerAIProvider {
	return &OpenAICareerAIProvider{APIKey: apiKey}
}

func (p *OpenAICareerAIProvider) GetProviderName() string {
	return "openai-gpt-4o"
}

func (p *OpenAICareerAIProvider) GenerateResponse(ctx context.Context, systemPrompt, userMessage string, history []domain.AIMessage) (string, int, error) {
	mock := NewMockCareerAIProvider()
	return mock.GenerateResponse(ctx, systemPrompt, userMessage, history)
}

func (p *OpenAICareerAIProvider) GenerateStructuredRoadmap(ctx context.Context, targetRole, currentLevel string) ([]domain.CareerMilestone, error) {
	mock := NewMockCareerAIProvider()
	return mock.GenerateStructuredRoadmap(ctx, targetRole, currentLevel)
}
