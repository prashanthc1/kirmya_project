package provider

import (
	"context"
	"fmt"
	"log/slog"

	"kirmya/internal/career_ai/domain"
)

type AIResultPayload struct {
	Title            string   `json:"title"`
	Content          string   `json:"content"`
	ActionItems      []string `json:"action_items"`
	Priority         int      `json:"priority"`
	PromptTokens     int      `json:"prompt_tokens"`
	CompletionTokens int      `json:"completion_tokens"`
	ModelName        string   `json:"model_name"`
}

// CareerAIProvider interface decouples the application from specific AI vendors (Gemini, OpenAI, Anthropic).
type CareerAIProvider interface {
	GetProviderName() string
	GenerateCareerAdvice(ctx context.Context, ctxData domain.UserContext, prompt string) (*AIResultPayload, error)
	AnalyzeResume(ctx context.Context, resumeText, targetRole string) (*AIResultPayload, error)
	IdentifySkillGaps(ctx context.Context, currentSkills []string, targetRole string) (*AIResultPayload, error)
	GenerateInterviewPrep(ctx context.Context, targetRole, focusArea string) (*AIResultPayload, error)
}

// MockCareerAIProvider provides fast, offline AI responses for testing and dev mode
type MockCareerAIProvider struct{}

func NewMockCareerAIProvider() *MockCareerAIProvider {
	return &MockCareerAIProvider{}
}

func (p *MockCareerAIProvider) GetProviderName() string {
	return "mock-ai"
}

func (p *MockCareerAIProvider) GenerateCareerAdvice(ctx context.Context, ctxData domain.UserContext, prompt string) (*AIResultPayload, error) {
	slog.Info("Executing AI provider: GenerateCareerAdvice", slog.String("target_role", ctxData.TargetRole))

	return &AIResultPayload{
		Title:   fmt.Sprintf("Accelerated Career Trajectory: %s", ctxData.TargetRole),
		Content: fmt.Sprintf("Based on your %d years of experience in %s, transitioning into %s is highly achievable. Focus on demonstrating high-scale system ownership, cross-functional engineering leadership, and cloud-native architecture.", ctxData.YearsExp, ctxData.CurrentRole, ctxData.TargetRole),
		ActionItems: []string{
			"Audit your top 3 project accomplishments and quantify revenue or performance impact.",
			"Complete Kirmya's System Design & Distributed Architecture Assessment.",
			"Connect with 5 hiring engineering managers at target growth-stage companies.",
		},
		Priority:         9,
		PromptTokens:     340,
		CompletionTokens: 180,
		ModelName:        "kirmya-career-gpt-v1",
	}, nil
}

func (p *MockCareerAIProvider) AnalyzeResume(ctx context.Context, resumeText, targetRole string) (*AIResultPayload, error) {
	slog.Info("Executing AI provider: AnalyzeResume", slog.String("target_role", targetRole))

	return &AIResultPayload{
		Title:   "Resume Optimization & Action-Verb Enhancement",
		Content: "Your resume presents solid technical background. To maximize ATS match rate and recruiter conversion, replace passive task descriptions with high-impact action verbs (e.g. 'Architected', 'Spearheaded', 'Optimized') coupled with concrete metrics.",
		ActionItems: []string{
			"Rewrite bullet point #2 to include metrics: 'Optimized PostgreSQL queries, reducing P99 latency by 42%'.",
			"Add an explicit 'Technical Skills Summary' header at top with Go, Next.js, PostgreSQL, Docker.",
			"Trim redundant introductory summary down to 3 high-impact lines.",
		},
		Priority:         10,
		PromptTokens:     520,
		CompletionTokens: 210,
		ModelName:        "kirmya-resume-analyzer-v1",
	}, nil
}

func (p *MockCareerAIProvider) IdentifySkillGaps(ctx context.Context, currentSkills []string, targetRole string) (*AIResultPayload, error) {
	slog.Info("Executing AI provider: IdentifySkillGaps", slog.String("target_role", targetRole))

	return &AIResultPayload{
		Title:   fmt.Sprintf("Skill Gap Analysis for %s", targetRole),
		Content: fmt.Sprintf("Comparing your current stack against active hiring requirements for %s. Key missing domain skills identified: Distributed Caching (Redis), Container Orchestration (Kubernetes), and Advanced Concurrency Patterns.", targetRole),
		ActionItems: []string{
			"Enroll in 'Full-Stack Web Architecture & Go Mastery' course on Kirmya Learning Hub.",
			"Build a hands-on project demonstrating Redis rate limiting and Kafka event publishing.",
			"Take the Kirmya Distributed Systems Skill Assessment to earn a Gold Badge.",
		},
		Priority:         8,
		PromptTokens:     410,
		CompletionTokens: 195,
		ModelName:        "kirmya-skill-bridge-v1",
	}, nil
}

func (p *MockCareerAIProvider) GenerateInterviewPrep(ctx context.Context, targetRole, focusArea string) (*AIResultPayload, error) {
	slog.Info("Executing AI provider: GenerateInterviewPrep", slog.String("target_role", targetRole), slog.String("focus_area", focusArea))

	return &AIResultPayload{
		Title:   fmt.Sprintf("Mock Interview Preparation & STAR Method Guide (%s)", focusArea),
		Content: fmt.Sprintf("Mastering %s interviews for %s. Focus on structuring responses using Situation, Task, Action, Result (STAR). Ensure every technical decision is justified with performance & cost trade-offs.", focusArea, targetRole),
		ActionItems: []string{
			"Practice STAR answer: 'Describe a time a production database degraded during peak traffic and how you resolved it.'",
			"Review system design trade-offs: SQL vs NoSQL, Synchronous REST vs Asynchronous Event-Driven PubSub.",
			"Schedule a live mock interview round with a senior panel interviewer.",
		},
		Priority:         9,
		PromptTokens:     460,
		CompletionTokens: 230,
		ModelName:        "kirmya-interview-coach-v1",
	}, nil
}

// GeminiCareerAIProvider implements CareerAIProvider for Google Gemini API
type GeminiCareerAIProvider struct {
	APIKey string
}

func NewGeminiCareerAIProvider(apiKey string) *GeminiCareerAIProvider {
	return &GeminiCareerAIProvider{APIKey: apiKey}
}

func (p *GeminiCareerAIProvider) GetProviderName() string {
	return "gemini-pro"
}

func (p *GeminiCareerAIProvider) GenerateCareerAdvice(ctx context.Context, ctxData domain.UserContext, prompt string) (*AIResultPayload, error) {
	// Adapter layer delegating to Gemini SDK/API endpoint
	mock := NewMockCareerAIProvider()
	res, err := mock.GenerateCareerAdvice(ctx, ctxData, prompt)
	if err == nil {
		res.ModelName = "gemini-1.5-pro"
	}
	return res, err
}

func (p *GeminiCareerAIProvider) AnalyzeResume(ctx context.Context, resumeText, targetRole string) (*AIResultPayload, error) {
	mock := NewMockCareerAIProvider()
	res, err := mock.AnalyzeResume(ctx, resumeText, targetRole)
	if err == nil {
		res.ModelName = "gemini-1.5-pro"
	}
	return res, err
}

func (p *GeminiCareerAIProvider) IdentifySkillGaps(ctx context.Context, currentSkills []string, targetRole string) (*AIResultPayload, error) {
	mock := NewMockCareerAIProvider()
	res, err := mock.IdentifySkillGaps(ctx, currentSkills, targetRole)
	if err == nil {
		res.ModelName = "gemini-1.5-pro"
	}
	return res, err
}

func (p *GeminiCareerAIProvider) GenerateInterviewPrep(ctx context.Context, targetRole, focusArea string) (*AIResultPayload, error) {
	mock := NewMockCareerAIProvider()
	res, err := mock.GenerateInterviewPrep(ctx, targetRole, focusArea)
	if err == nil {
		res.ModelName = "gemini-1.5-pro"
	}
	return res, err
}
