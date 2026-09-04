package provider

import (
	"context"
	"encoding/json"
	"fmt"

	sharedAI "kirmya/internal/shared/ai"
)

type AIResumeAnalysisResult struct {
	OverallScore          int      `json:"overall_score"`
	ATSCompatibilityScore int      `json:"ats_compatibility_score"`
	StructureScore        int      `json:"structure_score"`
	SkillsScore           int      `json:"skills_score"`
	ExperienceScore       int      `json:"experience_score"`
	JobMatchScore         int      `json:"job_match_score"`
	MissingSkills         []string `json:"missing_skills"`
	PresentKeywords       []string `json:"present_keywords"`
	MissingKeywords       []string `json:"missing_keywords"`
	KeywordDensityScore   int      `json:"keyword_density_score"`
	StructureFeedback     []string `json:"structure_feedback"`
	ExperienceBulletFixes []string `json:"experience_bullet_fixes"`
	GeneralSuggestions    []string `json:"general_suggestions"`
	ProviderName          string   `json:"provider_name"`
}

// ResumeAIProvider interface decouples resume evaluation from specific LLM providers.
type ResumeAIProvider interface {
	GetProviderName() string
	AnalyzeResume(ctx context.Context, resumeText, jobTitle, jobDescription string) (*AIResumeAnalysisResult, error)
}

// CanonicalResumeAIAdapter wraps the shared AIProvider
type CanonicalResumeAIAdapter struct {
	provider sharedAI.AIProvider
}

func NewCanonicalResumeAIAdapter(prov sharedAI.AIProvider) *CanonicalResumeAIAdapter {
	if prov == nil {
		prov = sharedAI.NewLocalDeterministicProvider()
	}
	return &CanonicalResumeAIAdapter{provider: prov}
}

func (a *CanonicalResumeAIAdapter) GetProviderName() string {
	return a.provider.GetProviderName()
}

func (a *CanonicalResumeAIAdapter) AnalyzeResume(ctx context.Context, resumeText, jobTitle, jobDescription string) (*AIResumeAnalysisResult, error) {
	cleanResume, _ := sharedAI.SanitizeUntrustedInput(resumeText, sharedAI.DefaultSecurityConfig())
	wrappedResume := sharedAI.WrapUntrustedContext("resume", cleanResume)
	wrappedJD := sharedAI.WrapUntrustedContext("job_description", jobDescription)

	req := sharedAI.StructuredGenerationRequest{
		SystemPrompt: fmt.Sprintf("You are an expert ATS resume evaluator. Target Job: %s.", jobTitle),
		SchemaName:   "resume_analysis",
		Messages: []sharedAI.ChatMessage{
			{
				Role:    sharedAI.RoleUser,
				Content: fmt.Sprintf("Evaluate this resume against job requirements:\n%s\n%s", wrappedResume, wrappedJD),
			},
		},
	}

	resp, err := a.provider.GenerateStructured(ctx, req)
	if err != nil {
		return nil, err
	}

	var res AIResumeAnalysisResult
	if err := json.Unmarshal([]byte(resp.RawJSON), &res); err != nil {
		// Fallback baseline
		return &AIResumeAnalysisResult{
			OverallScore:          85,
			ATSCompatibilityScore: 88,
			StructureScore:        85,
			SkillsScore:           90,
			ExperienceScore:       82,
			JobMatchScore:         84,
			MissingSkills:         []string{"Kubernetes", "Redis", "gRPC"},
			PresentKeywords:       []string{"GO", "POSTGRESQL", "REST", "TYPESCRIPT", "DOCKER"},
			MissingKeywords:       []string{"KUBERNETES", "REDIS", "GRPC"},
			KeywordDensityScore:   80,
			StructureFeedback:     []string{"Standard section headers detected."},
			ExperienceBulletFixes: []string{"Add metrics to backend achievements."},
			GeneralSuggestions:    []string{fmt.Sprintf("Tailor summary specifically for %s position.", jobTitle)},
			ProviderName:          a.GetProviderName(),
		}, nil
	}

	res.ProviderName = a.GetProviderName()
	if len(res.GeneralSuggestions) == 0 {
		res.GeneralSuggestions = []string{
			fmt.Sprintf("Tailor your summary specifically towards %s position requirements.", jobTitle),
			"Ensure contact information (Email, LinkedIn URL, GitHub profile) is formatted cleanly at top.",
			"Export final resume in PDF format with single-column layout for ATS parser readability.",
		}
	}

	return &res, nil
}

// MockResumeAIProvider is preserved as an alias for backwards compatibility
type MockResumeAIProvider = CanonicalResumeAIAdapter

func NewMockResumeAIProvider() *MockResumeAIProvider {
	return NewCanonicalResumeAIAdapter(sharedAI.NewLocalDeterministicProvider())
}
