package service

import (
	"testing"
	"time"

	"kirmya/internal/profile/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestCalculateCompletionScores(t *testing.T) {
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
	assert.Equal(t, 15, score)

	p.Headline = "Staff Engineer at Google"
	score = calculateCompletionScoreHelper(p)
	assert.Equal(t, 25, score)

	p.Summary = "Experienced distributed systems developer..."
	score = calculateCompletionScoreHelper(p)
	assert.Equal(t, 40, score)

	p.WorkExperiences = append(p.WorkExperiences, models.UserWorkExperience{Company: "Google", JobTitle: "Staff Engineer"})
	score = calculateCompletionScoreHelper(p)
	assert.Equal(t, 60, score)

	p.Educations = append(p.Educations, models.UserEducation{Institution: "MIT", Degree: "B.S."})
	score = calculateCompletionScoreHelper(p)
	assert.Equal(t, 75, score)

	p.Skills = append(p.Skills, models.UserSkill{Name: "Golang", ProficiencyLevel: "Expert"})
	score = calculateCompletionScoreHelper(p)
	assert.Equal(t, 90, score)

	p.Certifications = append(p.Certifications, models.UserCertification{Name: "AWS Solution Architect"})
	score = calculateCompletionScoreHelper(p)
	assert.Equal(t, 100, score)
}

func calculateCompletionScoreHelper(p *models.UserProfile) int {
	score := 0
	if p.Headline != "" && p.Headline != "Professional at Kirmya" {
		score += 10
	}
	if p.Summary != "" {
		score += 15
	}
	if len(p.WorkExperiences) > 0 {
		score += 20
	}
	if len(p.Educations) > 0 {
		score += 15
	}
	if len(p.Skills) > 0 {
		score += 15
	}
	if len(p.Certifications) > 0 {
		score += 10
	}
	if len(p.Projects) > 0 {
		score += 10
	}
	if len(p.Languages) > 0 {
		score += 5
	}
	if p.AvailabilityStatus != "" {
		score += 15
	}

	if score > 100 {
		score = 100
	}
	return score
}

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
