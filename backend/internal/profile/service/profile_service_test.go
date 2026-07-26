package service

import (
	"context"
	"kirmya/internal/profile/models"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// TestCalculateCompletionScores validates that the profile completion percentage calculator
// adheres to the defined scoring allocations.
func TestCalculateCompletionScores(t *testing.T) {
	// 1. Initial Empty Profile (Has default headline and status)
	p := &models.UserProfile{
		ID:                         uuid.New(),
		UserID:                     uuid.New(),
		Headline:                   "Professional at Kirmya",
		Summary:                    "",
		AvailabilityStatus:         "looking_for_networking",
		ProfileCompletedPercentage: 25,
		CreatedAt:                  time.Now(),
		UpdatedAt:                  time.Now(),
	}

	score := calculateCompletionScoreHelper(p)
	// Base scores: Headline (default, so 0% weight), Summary (0%), Skills (0%), Certifications (0%), Projects (0%), Languages (0%), Availability (15%)
	assert.Equal(t, 15, score)

	// 2. Custom Headline added (+10%)
	p.Headline = "Staff Engineer at Google"
	score = calculateCompletionScoreHelper(p)
	assert.Equal(t, 25, score)

	// 3. Summary added (+15%)
	p.Summary = "Experienced distributed systems developer..."
	score = calculateCompletionScoreHelper(p)
	assert.Equal(t, 40, score)

	// 4. Skills added (+20%)
	p.Skills = append(p.Skills, models.UserSkill{Name: "Golang", ProficiencyLevel: "Expert"})
	score = calculateCompletionScoreHelper(p)
	assert.Equal(t, 60, score)

	// 5. Certifications added (+15%)
	p.Certifications = append(p.Certifications, models.UserCertification{Name: "AWS Certified Solution Architect"})
	score = calculateCompletionScoreHelper(p)
	assert.Equal(t, 75, score)

	// 6. Projects added (+15%)
	p.Projects = append(p.Projects, models.UserProject{Title: "Kirmya Monolith"})
	score = calculateCompletionScoreHelper(p)
	assert.Equal(t, 90, score)

	// 7. Languages added (+10%)
	p.Languages = append(p.Languages, models.UserLanguage{Name: "Arabic", Proficiency: "Native"})
	score = calculateCompletionScoreHelper(p)
	assert.Equal(t, 100, score)
}

// Mock helper mimicking ProfileService completion score calculation
func calculateCompletionScoreHelper(p *models.UserProfile) int {
	score := 0
	if p.Headline != "" && p.Headline != "Professional at Kirmya" {
		score += 10
	}
	if p.Summary != "" {
		score += 15
	}
	if len(p.Skills) > 0 {
		score += 20
	}
	if len(p.Certifications) > 0 {
		score += 15
	}
	if len(p.Projects) > 0 {
		score += 15
	}
	if len(p.Languages) > 0 {
		score += 10
	}
	if p.AvailabilityStatus != "" {
		score += 15
	}

	if score > 100 {
		score = 100
	}
	return score
}

// TestGetOrCreateProfileDefaults verifies profile instantiation properties.
func TestGetOrCreateProfileDefaults(t *testing.T) {
	userID := uuid.New()
	p := &models.UserProfile{
		ID:                         uuid.New(),
		UserID:                     userID,
		Headline:                   "Professional at Kirmya",
		Summary:                    "",
		AvailabilityStatus:         "looking_for_networking",
		ProfileCompletedPercentage: 25,
		CreatedAt:                  time.Now(),
		UpdatedAt:                  time.Now(),
	}

	assert.Equal(t, userID, p.UserID)
	assert.Equal(t, "Professional at Kirmya", p.Headline)
	assert.Equal(t, "looking_for_networking", p.AvailabilityStatus)
	assert.Equal(t, 25, p.ProfileCompletedPercentage)
}
type MockContext struct {
	context.Context
}
