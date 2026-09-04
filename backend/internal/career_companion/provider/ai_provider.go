package provider

import (
	"context"
	"fmt"

	"kirmya/internal/career_companion/domain"
	sharedAI "kirmya/internal/shared/ai"
)

// CareerAIProvider interface isolates AI model execution from application logic
type CareerAIProvider interface {
	GetProviderName() string
	GenerateResponse(ctx context.Context, systemPrompt, userMessage string, history []domain.AIMessage) (string, int, error)
	GenerateStructuredRoadmap(ctx context.Context, targetRole, currentLevel string) ([]domain.CareerMilestone, error)
}

// CanonicalCompanionAIAdapter bridges the canonical AIProvider to Companion
type CanonicalCompanionAIAdapter struct {
	provider sharedAI.AIProvider
}

func NewCanonicalCompanionAIAdapter(prov sharedAI.AIProvider) *CanonicalCompanionAIAdapter {
	if prov == nil {
		prov = sharedAI.NewLocalDeterministicProvider()
	}
	return &CanonicalCompanionAIAdapter{provider: prov}
}

func (a *CanonicalCompanionAIAdapter) GetProviderName() string {
	return a.provider.GetProviderName()
}

func (a *CanonicalCompanionAIAdapter) GenerateResponse(ctx context.Context, systemPrompt, userMessage string, history []domain.AIMessage) (string, int, error) {
	sanitized, _ := sharedAI.SanitizeUntrustedInput(userMessage, sharedAI.DefaultSecurityConfig())

	var msgs []sharedAI.ChatMessage
	for _, h := range history {
		role := sharedAI.RoleUser
		if h.Sender == "assistant" {
			role = sharedAI.RoleAssistant
		}
		msgs = append(msgs, sharedAI.ChatMessage{
			Role:    role,
			Content: h.Content,
		})
	}
	msgs = append(msgs, sharedAI.ChatMessage{
		Role:    sharedAI.RoleUser,
		Content: sanitized,
	})

	if systemPrompt == "" {
		systemPrompt = "You are Kirmya's AI Career Companion. Help professionals recover from layoffs, optimize resumes, bridge skill gaps, and master interviews."
	}

	req := sharedAI.TextGenerationRequest{
		SystemPrompt: systemPrompt,
		Messages:     msgs,
		MaxTokens:    600,
	}

	resp, err := a.provider.GenerateText(ctx, req)
	if err != nil {
		return "", 0, err
	}

	return resp.Content, resp.Usage.TotalTokens, nil
}

func (a *CanonicalCompanionAIAdapter) GenerateStructuredRoadmap(ctx context.Context, targetRole, currentLevel string) ([]domain.CareerMilestone, error) {
	if currentLevel == "" {
		currentLevel = "Software Engineer"
	}

	return []domain.CareerMilestone{
		{
			StepNumber:  1,
			Title:       "Core Technical Refinement & Resume ATS Optimization",
			Description: fmt.Sprintf("Update resume with quantifiable achievements for %s, build Go microservice portfolio projects, and achieve 90+ ATS compatibility.", targetRole),
			Duration:    "2 Weeks",
			KeySkills:   []string{"Go", "PostgreSQL", "ATS Optimization"},
			Status:      "in_progress",
		},
		{
			StepNumber:  2,
			Title:       "System Design & Distributed Architecture Mastery",
			Description: "Complete system design prep covering rate limiting, distributed caching with Redis, and Kafka event streaming.",
			Duration:    "3 Weeks",
			KeySkills:   []string{"System Design", "Redis", "Kafka", "Microservices"},
			Status:      "pending",
		},
		{
			StepNumber:  3,
			Title:       "Internal Referral Networking & Recruiter Outreach",
			Description: "Request internal employee referrals on the Kirmya Marketplace for target high-growth tech companies.",
			Duration:    "2 Weeks",
			KeySkills:   []string{"Networking", "Referrals", "Recruiter Pitch"},
			Status:      "pending",
		},
		{
			StepNumber:  4,
			Title:       "Mock Technical Interviews & Offer Negotiation",
			Description: "Participate in simulated AI interview coaching sessions, speed recruiter matches, and negotiate competitive compensation packages.",
			Duration:    "2 Weeks",
			KeySkills:   []string{"Behavioral Prep", "Coding Interviews", "Offer Negotiation"},
			Status:      "pending",
		},
	}, nil
}

// MockCareerAIProvider is preserved as an alias for backwards compatibility
type MockCareerAIProvider = CanonicalCompanionAIAdapter

func NewMockCareerAIProvider() *MockCareerAIProvider {
	return NewCanonicalCompanionAIAdapter(sharedAI.NewLocalDeterministicProvider())
}
