package service

import (
	"context"
	"encoding/json"
	"kirmya/internal/ai/models"
	"kirmya/internal/ai/provider"
	"kirmya/internal/ai/repository"
	"time"

	"github.com/google/uuid"
)

type AIService struct {
	repo     *repository.AIRepository
	provider provider.AIProvider
}

func NewAIService(repo *repository.AIRepository, prov provider.AIProvider) *AIService {
	return &AIService{
		repo:     repo,
		provider: prov,
	}
}

func (s *AIService) GetPreferences(ctx context.Context, userID uuid.UUID) (*models.AIPreference, error) {
	return s.repo.GetPreferences(ctx, userID)
}

func (s *AIService) UpdatePreferences(ctx context.Context, userID uuid.UUID, p string, temp float64, maxT int) error {
	pref := &models.AIPreference{
		UserID:           userID,
		SelectedProvider: p,
		Temperature:      temp,
		MaxTokens:        maxT,
		UpdatedAt:        time.Now(),
	}
	return s.repo.UpdatePreferences(ctx, pref)
}

func (s *AIService) AnalyzeResume(ctx context.Context, userID uuid.UUID, resumeText string) (map[string]interface{}, error) {
	raw, promptT, compT, err := s.provider.AnalyzeResume(ctx, resumeText)
	if err != nil {
		return nil, err
	}
	return s.saveLogsAndParse(ctx, userID, "resume_analysis", resumeText, raw, promptT, compT)
}

func (s *AIService) AnalyzeSkillGap(ctx context.Context, userID uuid.UUID, skills []string, role string) (map[string]interface{}, error) {
	inputBytes, _ := json.Marshal(map[string]interface{}{"skills": skills, "role": role})
	raw, promptT, compT, err := s.provider.AnalyzeSkillGap(ctx, skills, role)
	if err != nil {
		return nil, err
	}
	return s.saveLogsAndParse(ctx, userID, "skill_gap", string(inputBytes), raw, promptT, compT)
}

func (s *AIService) MatchJob(ctx context.Context, userID uuid.UUID, resumeText string, jd string) (map[string]interface{}, error) {
	inputBytes, _ := json.Marshal(map[string]interface{}{"resume": resumeText, "jd": jd})
	raw, promptT, compT, err := s.provider.MatchJob(ctx, resumeText, jd)
	if err != nil {
		return nil, err
	}
	return s.saveLogsAndParse(ctx, userID, "job_matching", string(inputBytes), raw, promptT, compT)
}

func (s *AIService) PrepareInterview(ctx context.Context, userID uuid.UUID, role string, exp string) (map[string]interface{}, error) {
	inputBytes, _ := json.Marshal(map[string]interface{}{"role": role, "experience": exp})
	raw, promptT, compT, err := s.provider.PrepareInterview(ctx, role, exp)
	if err != nil {
		return nil, err
	}
	return s.saveLogsAndParse(ctx, userID, "interview_prep", string(inputBytes), raw, promptT, compT)
}

func (s *AIService) SuggestCareer(ctx context.Context, userID uuid.UUID, interests []string, skills []string) (map[string]interface{}, error) {
	inputBytes, _ := json.Marshal(map[string]interface{}{"interests": interests, "skills": skills})
	raw, promptT, compT, err := s.provider.SuggestCareer(ctx, interests, skills)
	if err != nil {
		return nil, err
	}
	return s.saveLogsAndParse(ctx, userID, "career_suggestions", string(inputBytes), raw, promptT, compT)
}

// Helpers
func (s *AIService) saveLogsAndParse(ctx context.Context, userID uuid.UUID, feature string, input string, output string, promptT int, compT int) (map[string]interface{}, error) {
	reqID := uuid.New()

	// 1. Log request entry
	req := &models.AIRequest{
		ID:               reqID,
		UserID:           userID,
		Feature:          feature,
		Provider:         s.provider.GetName(),
		PromptTokens:     promptT,
		CompletionTokens: compT,
		CreatedAt:        time.Now(),
	}
	_ = s.repo.LogRequest(ctx, req)

	// 2. Parse response JSON block
	var parsed map[string]interface{}
	_ = json.Unmarshal([]byte(output), &parsed)

	// 3. Log result entry
	res := &models.AIResult{
		ID:             uuid.New(),
		RequestID:      reqID,
		RawInput:       input,
		RawOutput:      output,
		ParsedResponse: parsed,
		CreatedAt:      time.Now(),
	}
	_ = s.repo.LogResult(ctx, res)

	return parsed, nil
}
