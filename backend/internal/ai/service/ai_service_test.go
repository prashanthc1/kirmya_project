package service

import (
	"context"
	"kirmya/internal/ai/provider"
	"kirmya/internal/ai/repository"
	"testing"

	"github.com/google/uuid"
)

func TestAIPreferencesManagement(t *testing.T) {
	repo := repository.NewAIRepository(nil)
	prov := provider.NewMockAIProvider()
	svc := NewAIService(repo, prov)

	userID := uuid.New()

	// 1. Get default offline preferences
	pref, err := svc.GetPreferences(context.Background(), userID)
	if err != nil {
		t.Fatalf("Expected no error fetching preferences, got %v", err)
	}

	if pref.SelectedProvider != "mock" {
		t.Errorf("Expected default provider to be 'mock', got %s", pref.SelectedProvider)
	}

	// 2. Update preferences
	err = svc.UpdatePreferences(context.Background(), userID, "openai", 0.5, 500)
	if err != nil {
		t.Fatalf("Expected no error updating preferences, got %v", err)
	}
}

func TestAIResumeAnalysis(t *testing.T) {
	repo := repository.NewAIRepository(nil)
	prov := provider.NewMockAIProvider()
	svc := NewAIService(repo, prov)

	userID := uuid.New()
	resumeText := "Experienced software engineer specializing in Golang monolith structures."

	result, err := svc.AnalyzeResume(context.Background(), userID, resumeText)
	if err != nil {
		t.Fatalf("Expected no error analyzing resume, got %v", err)
	}

	scoreVal, exists := result["score"]
	if !exists {
		t.Fatal("Expected key 'score' in parsed response")
	}

	score, ok := scoreVal.(float64)
	if !ok || score != 85 {
		t.Errorf("Expected score to be 85, got %v", scoreVal)
	}
}

func TestAISkillGapAnalysis(t *testing.T) {
	repo := repository.NewAIRepository(nil)
	prov := provider.NewMockAIProvider()
	svc := NewAIService(repo, prov)

	userID := uuid.New()
	userSkills := []string{"Go", "SQL"}

	result, err := svc.AnalyzeSkillGap(context.Background(), userID, userSkills, "DevOps Engineer")
	if err != nil {
		t.Fatalf("Expected no error analyzing skill gap, got %v", err)
	}

	role, exists := result["targetRole"]
	if !exists || role != "DevOps Engineer" {
		t.Errorf("Expected targetRole to be 'DevOps Engineer', got %v", role)
	}
}
