package provider

import (
	"context"
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

// MockAIProvider is a fully functional, local simulated provider requiring zero paid keys.
type MockAIProvider struct{}

func NewMockAIProvider() *MockAIProvider {
	return &MockAIProvider{}
}

func (m *MockAIProvider) GetName() string {
	return "mock"
}

func (m *MockAIProvider) AnalyzeResume(ctx context.Context, resumeText string) (string, int, int, error) {
	// Realistic analysis json response
	raw := `{
		"score": 85,
		"grammarScore": 95,
		"concisenessScore": 80,
		"keyStrengths": ["Strong background in backend modular systems", "Familiarity with container orchestrators"],
		"improvements": ["Elaborate on database replication details", "Incorporate metrics on query optimization"]
	}`
	return raw, 120, 240, nil
}

func (m *MockAIProvider) AnalyzeSkillGap(ctx context.Context, userSkills []string, targetRole string) (string, int, int, error) {
	raw := `{
		"targetRole": "` + targetRole + `",
		"matchingSkills": ["Go", "SQL", "Git"],
		"missingSkills": ["Kubernetes", "gRPC", "Redis Cluster"],
		"recommendations": ["Review distributed systems patterns", "Build local project utilizing go-redis"]
	}`
	return raw, 150, 310, nil
}

func (m *MockAIProvider) MatchJob(ctx context.Context, resumeText string, jobDescription string) (string, int, int, error) {
	raw := `{
		"matchScore": 78,
		"verdict": "Strong Candidate",
		"keyAlignments": ["Hands-on with microservices architecture", "PostgreSQL database optimization experience"],
		"potentialRisks": ["No experience listed with React frontend libraries"]
	}`
	return raw, 220, 380, nil
}

func (m *MockAIProvider) PrepareInterview(ctx context.Context, targetRole string, experienceLevel string) (string, int, int, error) {
	raw := `{
		"role": "` + targetRole + `",
		"experienceLevel": "` + experienceLevel + `",
		"questions": [
			{
				"question": "How do you mitigate database deadlocks in high concurrency environments?",
				"expectedFocus": "Discussion of locking granularity, read/write transaction order, and retry loops."
			},
			{
				"question": "Explain Go's channel mechanics and garbage collector pacing.",
				"expectedFocus": "Details on stack vs heap allocation, channel buffers, and runtime scheduler queues."
			}
		]
	}`
	return raw, 180, 420, nil
}

func (m *MockAIProvider) SuggestCareer(ctx context.Context, interests []string, skills []string) (string, int, int, error) {
	raw := `{
		"suggestedPaths": [
			{
				"title": "Platform Infrastructure Engineer",
				"relevanceScore": 92,
				"reason": "Strong alignment between backend programming skills and distributed system configurations."
			},
			{
				"title": "Site Reliability Architect",
				"relevanceScore": 84,
				"reason": "Interests in performance tuning and resilient infrastructure layouts."
			}
		]
	}`
	return raw, 140, 290, nil
}
