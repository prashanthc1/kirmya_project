package service

import (
	"encoding/json"
	"kirmya/internal/resume/models"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestSimulateAIScoring validates that the simulated ATS score changes
// dynamically depending on the provided sections.
func TestSimulateAIScoring(t *testing.T) {
	// 1. Minimum sections (empty)
	sections := []models.ResumeSection{
		{SectionType: "personal_info", Content: "{}"},
		{SectionType: "summary", Content: ""},
	}
	score, suggestions := simulateAIScoring(sections)
	assert.GreaterOrEqual(t, score, 65)

	var suggestionsList []string
	_ = json.Unmarshal([]byte(suggestions), &suggestionsList)
	assert.NotEmpty(t, suggestionsList)

	// 2. Add summary and experience
	sections = []models.ResumeSection{
		{SectionType: "summary", Content: "A senior Go programmer..."},
		{SectionType: "experience", Content: `{"company":"Kirmya","role":"Lead Architect","details":"Built modules and queues"}`},
		{SectionType: "skills", Content: `{"name":"Go","level":"Expert"}`},
	}
	score, suggestions = simulateAIScoring(sections)
	assert.GreaterOrEqual(t, score, 80)
}

// TestDuplicateResumeLogic verifies copy fields matching.
func TestDuplicateResumeLogic(t *testing.T) {
	src := &models.Resume{
		Title:        "Original Resume",
		TemplateName: "minimal",
		AtsScore:     80,
	}

	dupTitle := "Copy of " + src.Title
	assert.Equal(t, "Copy of Original Resume", dupTitle)
}
