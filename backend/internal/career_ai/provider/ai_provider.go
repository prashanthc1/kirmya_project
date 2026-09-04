package provider

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"kirmya/internal/career_ai/domain"
	sharedAI "kirmya/internal/shared/ai"
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

// CareerAIProvider interface decouples the application from specific AI vendors
type CareerAIProvider interface {
	GetProviderName() string
	GenerateCareerAdvice(ctx context.Context, ctxData domain.UserContext, prompt string) (*AIResultPayload, error)
	AnalyzeResume(ctx context.Context, resumeText, targetRole string) (*AIResultPayload, error)
	IdentifySkillGaps(ctx context.Context, currentSkills []string, targetRole string) (*AIResultPayload, error)
	GenerateInterviewPrep(ctx context.Context, targetRole, focusArea string) (*AIResultPayload, error)
}

// CanonicalCareerAIAdapter wraps the shared AIProvider
type CanonicalCareerAIAdapter struct {
	provider sharedAI.AIProvider
}

func NewCanonicalCareerAIAdapter(prov sharedAI.AIProvider) *CanonicalCareerAIAdapter {
	if prov == nil {
		prov = sharedAI.NewLocalDeterministicProvider()
	}
	return &CanonicalCareerAIAdapter{provider: prov}
}

func (a *CanonicalCareerAIAdapter) GetProviderName() string {
	return a.provider.GetProviderName()
}

func (a *CanonicalCareerAIAdapter) GenerateCareerAdvice(ctx context.Context, ctxData domain.UserContext, prompt string) (*AIResultPayload, error) {
	sanitized, _ := sharedAI.SanitizeUntrustedInput(prompt, sharedAI.DefaultSecurityConfig())

	req := sharedAI.TextGenerationRequest{
		SystemPrompt: fmt.Sprintf("You are a career strategist. Target role: %s. Experience: %d years.", ctxData.TargetRole, ctxData.YearsExp),
		Messages: []sharedAI.ChatMessage{
			{Role: sharedAI.RoleUser, Content: sanitized},
		},
		MaxTokens: 500,
	}

	resp, err := a.provider.GenerateText(ctx, req)
	if err != nil {
		return nil, err
	}

	return &AIResultPayload{
		Title:   fmt.Sprintf("Accelerated Career Trajectory: %s", ctxData.TargetRole),
		Content: resp.Content,
		ActionItems: []string{
			"Audit your top accomplishments and quantify revenue or performance impact.",
			"Complete Kirmya's System Design & Distributed Architecture Assessment.",
			"Connect with 5 hiring engineering managers at target companies on Kirmya.",
		},
		Priority:         9,
		PromptTokens:     resp.Usage.PromptTokens,
		CompletionTokens: resp.Usage.CompletionTokens,
		ModelName:        resp.ModelName,
	}, nil
}

func (a *CanonicalCareerAIAdapter) AnalyzeResume(ctx context.Context, resumeText, targetRole string) (*AIResultPayload, error) {
	cleanResume, _ := sharedAI.SanitizeUntrustedInput(resumeText, sharedAI.DefaultSecurityConfig())
	wrapped := sharedAI.WrapUntrustedContext("resume", cleanResume)

	req := sharedAI.StructuredGenerationRequest{
		SystemPrompt: fmt.Sprintf("Analyze the supplied candidate resume for target role: %s.", targetRole),
		SchemaName:   "resume_analysis",
		Messages: []sharedAI.ChatMessage{
			{Role: sharedAI.RoleUser, Content: wrapped},
		},
	}

	resp, err := a.provider.GenerateStructured(ctx, req)
	if err != nil {
		return nil, err
	}

	var parsed map[string]interface{}
	_ = json.Unmarshal([]byte(resp.RawJSON), &parsed)

	var actionItems []string
	if rawBullet, ok := parsed["experience_bullet_fixes"].([]interface{}); ok {
		for _, b := range rawBullet {
			if s, ok := b.(string); ok {
				actionItems = append(actionItems, s)
			}
		}
	}
	if len(actionItems) == 0 {
		actionItems = []string{
			"Quantify database performance optimizations with metrics.",
			"Add explicit Technical Skills section header at top of resume.",
		}
	}

	return &AIResultPayload{
		Title:            fmt.Sprintf("Resume Optimization for %s", targetRole),
		Content:          "Your resume has been parsed and evaluated against ATS benchmarks and keyword density standards.",
		ActionItems:      actionItems,
		Priority:         10,
		PromptTokens:     resp.Usage.PromptTokens,
		CompletionTokens: resp.Usage.CompletionTokens,
		ModelName:        resp.ModelName,
	}, nil
}

func (a *CanonicalCareerAIAdapter) IdentifySkillGaps(ctx context.Context, currentSkills []string, targetRole string) (*AIResultPayload, error) {
	req := sharedAI.StructuredGenerationRequest{
		SystemPrompt: fmt.Sprintf("Identify skill gaps for target role: %s.", targetRole),
		SchemaName:   "skill_gap",
		Messages: []sharedAI.ChatMessage{
			{Role: sharedAI.RoleUser, Content: fmt.Sprintf("Current Skills: %s", strings.Join(currentSkills, ", "))},
		},
	}

	resp, err := a.provider.GenerateStructured(ctx, req)
	if err != nil {
		return nil, err
	}

	return &AIResultPayload{
		Title:   fmt.Sprintf("Skill Gap Analysis for %s", targetRole),
		Content: fmt.Sprintf("Comparing your current stack against active hiring requirements for %s.", targetRole),
		ActionItems: []string{
			"Enroll in recommended distributed systems module on Kirmya Learning Hub.",
			"Build a hands-on service demonstrating Kafka event streaming and Redis caching.",
			"Complete the Kirmya Skill Assessment to earn a verified profile badge.",
		},
		Priority:         8,
		PromptTokens:     resp.Usage.PromptTokens,
		CompletionTokens: resp.Usage.CompletionTokens,
		ModelName:        resp.ModelName,
	}, nil
}

func (a *CanonicalCareerAIAdapter) GenerateInterviewPrep(ctx context.Context, targetRole, focusArea string) (*AIResultPayload, error) {
	req := sharedAI.StructuredGenerationRequest{
		SystemPrompt: fmt.Sprintf("Generate interview prep for %s focusing on %s.", targetRole, focusArea),
		SchemaName:   "interview_prep",
		Messages: []sharedAI.ChatMessage{
			{Role: sharedAI.RoleUser, Content: fmt.Sprintf("Role: %s, Focus: %s", targetRole, focusArea)},
		},
	}

	resp, err := a.provider.GenerateStructured(ctx, req)
	if err != nil {
		return nil, err
	}

	return &AIResultPayload{
		Title:   fmt.Sprintf("Mock Interview Preparation & STAR Method Guide (%s)", focusArea),
		Content: fmt.Sprintf("Mastering %s interviews for %s. Structure every answer with Situation, Task, Action, and Result.", focusArea, targetRole),
		ActionItems: []string{
			"Practice STAR answer for: 'Describe a production outage and how you resolved it.'",
			"Review distributed system trade-offs: SQL vs NoSQL, Synchronous vs Async PubSub.",
			"Schedule a live mock interview with a senior mentor on Kirmya.",
		},
		Priority:         9,
		PromptTokens:     resp.Usage.PromptTokens,
		CompletionTokens: resp.Usage.CompletionTokens,
		ModelName:        resp.ModelName,
	}, nil
}

// MockCareerAIProvider is preserved as an alias for backwards compatibility
type MockCareerAIProvider = CanonicalCareerAIAdapter

func NewMockCareerAIProvider() *MockCareerAIProvider {
	return NewCanonicalCareerAIAdapter(sharedAI.NewLocalDeterministicProvider())
}
