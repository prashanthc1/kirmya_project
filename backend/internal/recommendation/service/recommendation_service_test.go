package service

import (
	"context"
	"kirmya/internal/recommendation/models"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestRecommendationMatchingAlgorithm checks that the scoring weights are aggregated correctly
// and that match explanations match the expected conditions.
func TestRecommendationMatchingAlgorithm(t *testing.T) {
	headline := "Staff Software Engineer"
	skills := []string{"Go", "PostgreSQL", "Redis"}
	completeness := 80

	pref := &models.UserJobPreferences{
		PreferredTitles:     []string{"Go Developer", "Software Engineer"},
		PreferredLocations:  []string{"Dubai"},
		PreferredIndustries: []string{"Technology"},
		MinSalary:           20000,
	}

	// 1. Exact Match Job (Should match Title, Location, Salary, Industry, and all Skills)
	job := models.JobSummaryDTO{
		ID:             uuid.New(),
		Title:          "Senior Go Software Engineer",
		Location:       "Dubai, UAE",
		SalaryMax:      25000,
		Industry:       "Technology",
		RequiredSkills: []string{"Go", "PostgreSQL"},
	}

	score, reasons := computeMatchScore(job, headline, skills, completeness, pref)

	// Score calculation details:
	// - Title matches "Software Engineer" -> +25
	// - Skills match: Go and PostgreSQL both present (2/2) -> +35
	// - Location matches "Dubai" -> +15
	// - Salary matches 25000 >= 20000 -> +15
	// - Industry matches "Technology" -> +10
	// Total expected = 25 + 35 + 15 + 15 + 10 = 100
	assert.Equal(t, 100, score)
	assert.Contains(t, reasons, "Matches your target job titles")
	assert.Contains(t, reasons, "Matches 2 of your core skills")
	assert.Contains(t, reasons, "Located in your preferred region (Dubai, UAE)")
	assert.Contains(t, reasons, "Meets your target compensation expectations")

	// 2. Mismatched Job (Location, Salary and Industry mismatch)
	badJob := models.JobSummaryDTO{
		ID:             uuid.New(),
		Title:          "Product Manager",
		Location:       "London",
		SalaryMax:      12000,
		Industry:       "Healthcare",
		RequiredSkills: []string{"Product Roadmap"},
	}

	score, _ = computeMatchScore(badJob, headline, skills, completeness, pref)
	assert.Equal(t, 0, score)
}

func TestPersonalizedFeedGeneration(t *testing.T) {
	svc := NewRecommendationService(nil, nil)
	userID := uuid.New()

	feed, err := svc.GetPersonalizedFeed(context.Background(), userID, "", 10)
	require.NoError(t, err)
	assert.NotNil(t, feed)
	assert.NotEmpty(t, feed.Items)

	// Ensure multiple item types are interleaved
	itemTypes := make(map[string]bool)
	for _, item := range feed.Items {
		assert.NotEmpty(t, item.Title)
		assert.NotEmpty(t, item.ItemType)
		assert.True(t, item.MatchScore > 0)
		itemTypes[item.ItemType] = true
	}

	assert.True(t, itemTypes["career_tip"])
	assert.True(t, itemTypes["job"])
	assert.True(t, itemTypes["person"])
	assert.True(t, itemTypes["community"])
}

func TestRecommendedPeopleAndCommunities(t *testing.T) {
	svc := NewRecommendationService(nil, nil)
	userID := uuid.New()

	people, err := svc.GetRecommendedPeople(context.Background(), userID, 5)
	require.NoError(t, err)
	assert.NotEmpty(t, people)
	for _, p := range people {
		assert.NotEqual(t, userID, p.UserID)
		assert.NotEmpty(t, p.FullName)
		assert.NotEmpty(t, p.Headline)
		assert.NotEmpty(t, p.Reason)
	}

	comms, err := svc.GetRecommendedCommunities(context.Background(), userID, 5)
	require.NoError(t, err)
	assert.NotEmpty(t, comms)
	for _, c := range comms {
		assert.NotEmpty(t, c.Name)
		assert.NotEmpty(t, c.Category)
		assert.True(t, c.MemberCount > 0)
	}
}

