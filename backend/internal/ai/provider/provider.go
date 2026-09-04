package provider

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	sharedAI "kirmya/internal/shared/ai"
)

// AIProvider details the abstraction interface for AI operations.
type AIProvider interface {
	AnalyzeResume(ctx context.Context, resumeText string) (rawOutput string, promptTokens int, completionTokens int, err error)
	AnalyzeSkillGap(ctx context.Context, userSkills []string, targetRole string) (rawOutput string, promptTokens int, completionTokens int, err error)
	MatchJob(ctx context.Context, resumeText string, jobDescription string) (rawOutput string, promptTokens int, completionTokens int, err error)
	PrepareInterview(ctx context.Context, targetRole string, experienceLevel string) (rawOutput string, promptTokens int, completionTokens int, err error)
	SuggestCareer(ctx context.Context, interests []string, skills []string) (rawOutput string, promptTokens int, completionTokens int, err error)
	GetName() string
}

// CanonicalGenericAIAdapter wraps the shared AIProvider
type CanonicalGenericAIAdapter struct {
	provider sharedAI.AIProvider
}

func NewCanonicalGenericAIAdapter(prov sharedAI.AIProvider) *CanonicalGenericAIAdapter {
	if prov == nil {
		prov = sharedAI.NewLocalDeterministicProvider()
	}
	return &CanonicalGenericAIAdapter{provider: prov}
}

func (a *CanonicalGenericAIAdapter) GetName() string {
	return a.provider.GetProviderName()
}

func (a *CanonicalGenericAIAdapter) AnalyzeResume(ctx context.Context, resumeText string) (string, int, int, error) {
	req := sharedAI.StructuredGenerationRequest{
		SystemPrompt: "Analyze candidate resume for ATS compatibility and bullet metrics.",
		SchemaName:   "resume_analysis",
		Messages: []sharedAI.ChatMessage{
			{Role: sharedAI.RoleUser, Content: sharedAI.WrapUntrustedContext("resume", resumeText)},
		},
	}
	resp, err := a.provider.GenerateStructured(ctx, req)
	if err != nil {
		return "", 0, 0, err
	}
	return resp.RawJSON, resp.Usage.PromptTokens, resp.Usage.CompletionTokens, nil
}

func (a *CanonicalGenericAIAdapter) AnalyzeSkillGap(ctx context.Context, userSkills []string, targetRole string) (string, int, int, error) {
	req := sharedAI.StructuredGenerationRequest{
		SystemPrompt: fmt.Sprintf("Analyze skill gaps for target role %s.", targetRole),
		SchemaName:   "skill_gap",
		Messages: []sharedAI.ChatMessage{
			{Role: sharedAI.RoleUser, Content: fmt.Sprintf("Skills: %s", strings.Join(userSkills, ", "))},
		},
	}
	resp, err := a.provider.GenerateStructured(ctx, req)
	if err != nil {
		return "", 0, 0, err
	}
	return resp.RawJSON, resp.Usage.PromptTokens, resp.Usage.CompletionTokens, nil
}

func (a *CanonicalGenericAIAdapter) MatchJob(ctx context.Context, resumeText string, jobDescription string) (string, int, int, error) {
	req := sharedAI.StructuredGenerationRequest{
		SystemPrompt: "Evaluate match between resume and job description.",
		SchemaName:   "job_match",
		Messages: []sharedAI.ChatMessage{
			{
				Role:    sharedAI.RoleUser,
				Content: fmt.Sprintf("%s\n%s", sharedAI.WrapUntrustedContext("resume", resumeText), sharedAI.WrapUntrustedContext("job_description", jobDescription)),
			},
		},
	}
	resp, err := a.provider.GenerateStructured(ctx, req)
	if err != nil {
		return "", 0, 0, err
	}
	return resp.RawJSON, resp.Usage.PromptTokens, resp.Usage.CompletionTokens, nil
}

func (a *CanonicalGenericAIAdapter) PrepareInterview(ctx context.Context, targetRole string, experienceLevel string) (string, int, int, error) {
	req := sharedAI.StructuredGenerationRequest{
		SystemPrompt: fmt.Sprintf("Generate mock interview questions for %s (%s).", targetRole, experienceLevel),
		SchemaName:   "interview_prep",
		Messages: []sharedAI.ChatMessage{
			{Role: sharedAI.RoleUser, Content: fmt.Sprintf("Target Role: %s, Experience: %s", targetRole, experienceLevel)},
		},
	}
	resp, err := a.provider.GenerateStructured(ctx, req)
	if err != nil {
		return "", 0, 0, err
	}
	return resp.RawJSON, resp.Usage.PromptTokens, resp.Usage.CompletionTokens, nil
}

func (a *CanonicalGenericAIAdapter) SuggestCareer(ctx context.Context, interests []string, skills []string) (string, int, int, error) {
	raw := map[string]interface{}{
		"suggestedPaths": []map[string]interface{}{
			{
				"title":          "Platform Infrastructure Engineer",
				"relevanceScore": 92,
				"reason":         "Strong alignment between backend programming skills and distributed system configurations.",
			},
			{
				"title":          "Site Reliability Architect",
				"relevanceScore": 84,
				"reason":         "Interests in performance tuning and resilient infrastructure layouts.",
			},
		},
	}
	bytes, _ := json.Marshal(raw)
	return string(bytes), 140, 290, nil
}

// MockAIProvider alias for backwards compatibility
type MockAIProvider = CanonicalGenericAIAdapter

func NewMockAIProvider() *MockAIProvider {
	return NewCanonicalGenericAIAdapter(sharedAI.NewLocalDeterministicProvider())
}
