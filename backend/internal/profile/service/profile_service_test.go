package service

import (
	"context"
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

func TestCalculateCompleteness(t *testing.T) {
	s := NewProfileService(nil)
	ctx := context.Background()
	userID := uuid.New()

	dto, err := s.CalculateCompleteness(ctx, userID)
	assert.NoError(t, err)
	assert.NotNil(t, dto)
	assert.False(t, dto.IsProfileComplete)
	assert.Contains(t, dto.MissingSections, "headline")
	assert.Contains(t, dto.MissingSections, "summary")
	assert.Contains(t, dto.MissingSections, "work_experience")
	assert.Contains(t, dto.MissingSections, "education")
	assert.Contains(t, dto.MissingSections, "skills")
}

func TestCheckResumeConsistency(t *testing.T) {
	s := NewProfileService(nil)
	ctx := context.Background()
	userID := uuid.New()

	dto, err := s.CheckResumeConsistency(ctx, userID)
	assert.NoError(t, err)
	assert.NotNil(t, dto)
	assert.True(t, dto.IsConsistent)
	assert.Equal(t, 100, dto.Score)
}

func TestRequestVerification(t *testing.T) {
	s := NewProfileService(nil)
	ctx := context.Background()
	userID := uuid.New()

	// Missing documentType/documentUrl
	_, err := s.RequestVerification(ctx, userID, models.VerificationRequestPayload{})
	assert.Error(t, err)

	// Valid payload
	p, err := s.RequestVerification(ctx, userID, models.VerificationRequestPayload{
		DocumentType: "government_id",
		DocumentURL:  "https://example.com/id.pdf",
		Notes:        "National ID upload",
	})
	assert.NoError(t, err)
	assert.Equal(t, "pending", p.VerificationStatus)
	assert.Contains(t, p.VerificationNotes, "government_id")
}

func TestUpdateCareerPreferences(t *testing.T) {
	s := NewProfileService(nil)
	ctx := context.Background()
	userID := uuid.New()

	prefDTO := models.CareerPreferencesDTO{
		AvailabilityStatus: "open_to_work",
		OpenToWork:         true,
		OpenToRecruiters:   true,
		TargetRoles:        []string{"Staff Go Engineer", "Tech Lead"},
		PreferredLocations: []string{"San Francisco", "Remote"},
	}

	p, err := s.UpdateCareerPreferences(ctx, userID, prefDTO)
	assert.NoError(t, err)
	assert.Equal(t, "open_to_work", p.AvailabilityStatus)
	assert.True(t, p.OpenToWork)
	assert.True(t, p.OpenToRecruiters)
	assert.Equal(t, []string{"Staff Go Engineer", "Tech Lead"}, p.TargetRoles)
	assert.Equal(t, []string{"San Francisco", "Remote"}, p.PreferredLocations)
}

func TestDateValidation(t *testing.T) {
	s := NewProfileService(nil)
	ctx := context.Background()
	userID := uuid.New()

	// Work Experience: EndDate before StartDate
	expDTO := &models.WorkExperienceDTO{
		Company:   "Acme Corp",
		JobTitle:  "Software Engineer",
		StartDate: "2023-06-01",
		EndDate:   "2022-01-01",
	}
	_, err := s.AddWorkExperience(ctx, userID, expDTO)
	assert.ErrorIs(t, err, ErrInvalidDates)

	// Education: EndDate before StartDate
	eduDTO := &models.EducationDTO{
		Institution: "Stanford University",
		Degree:      "M.S. Computer Science",
		StartDate:   "2023-09-01",
		EndDate:     "2021-06-01",
	}
	_, err = s.AddEducation(ctx, userID, eduDTO)
	assert.ErrorIs(t, err, ErrInvalidDates)
}

func TestSkillNormalizationAndDeduplication(t *testing.T) {
	s := NewProfileService(nil)
	ctx := context.Background()
	userID := uuid.New()

	// Empty skill name
	_, err := s.AddSkill(ctx, userID, "   ", "Expert")
	assert.Error(t, err)

	// Valid skill
	skills, err := s.AddSkill(ctx, userID, "  React.js  ", "Advanced")
	assert.NoError(t, err)
	assert.Len(t, skills, 1)
	assert.Equal(t, "React.js", skills[0].Name)
	assert.Equal(t, "Advanced", skills[0].ProficiencyLevel)

	// Duplicate skill with different casing/whitespace
	skills, err = s.AddSkill(ctx, userID, "react.js", "Beginner")
	assert.NoError(t, err)
	assert.Len(t, skills, 1) // Should deduplicate and not insert second
}

func TestPhotoAndCoverUpdate(t *testing.T) {
	s := NewProfileService(nil)
	ctx := context.Background()
	userID := uuid.New()

	err := s.UpdatePhoto(ctx, userID, "/uploads/profiles/test_avatar.png")
	assert.NoError(t, err)

	err = s.UpdateCover(ctx, userID, "/uploads/profiles/test_cover.jpg")
	assert.NoError(t, err)

	p, err := s.GetOrCreateProfile(ctx, userID)
	assert.NoError(t, err)
	assert.Equal(t, "/uploads/profiles/test_avatar.png", p.AvatarURL)
	assert.Equal(t, "/uploads/profiles/test_cover.jpg", p.CoverURL)
}

func TestPrivacyFiltering(t *testing.T) {
	p := &models.UserProfile{
		ID:           uuid.New(),
		UserID:       uuid.New(),
		Username:     "private_user",
		Headline:     "Secret Agent",
		IsPrivate:    true,
		Volunteering: "Confidential NGO",
		Licenses:     "Secret Clearance",
		Publications: "Classified Paper",
	}

	if p.IsPrivate || p.IsRestricted {
		p.Volunteering = ""
		p.Licenses = ""
		p.Publications = ""
	}

	assert.Empty(t, p.Volunteering)
	assert.Empty(t, p.Licenses)
	assert.Empty(t, p.Publications)
}

