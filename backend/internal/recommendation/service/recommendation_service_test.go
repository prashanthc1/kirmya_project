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

func TestNoDataRecommendsNothingRatherThanInventingIt(t *testing.T) {
	// A service with no repository has no jobs, no people and no communities to
	// recommend, which is also the state of a new deployment and of every
	// account before anyone else has signed up.
	//
	// It used to answer that state with three job postings at named employers
	// with salaries, two people with headlines, locations and the names of the
	// connections they supposedly shared with the caller, and two communities
	// with member counts - none of which exist. The feed opened with a fixed
	// "AI Career Optimization Insight" scored 95 and attributed to the reader's
	// verified profile skills.
	svc := NewRecommendationService(nil, nil)
	userID := uuid.New()

	people, err := svc.GetRecommendedPeople(context.Background(), userID, 5)
	require.NoError(t, err)
	assert.Empty(t, people, "nobody to recommend must mean nobody, not an invented peer")

	comms, err := svc.GetRecommendedCommunities(context.Background(), userID, 5)
	require.NoError(t, err)
	assert.Empty(t, comms, "no communities must mean none, not two with member counts")

	feed, err := svc.GetPersonalizedFeed(context.Background(), userID, "", 10)
	require.NoError(t, err)
	require.NotNil(t, feed)
	assert.Empty(t, feed.Items, "an empty platform produces an empty feed")
	assert.Equal(t, 0, feed.TotalCount)
	assert.False(t, feed.HasMore)
}

func TestFeedCarriesOnlyRecommendationsItWasGiven(t *testing.T) {
	// Whatever the feed contains has to come from a recommendation stream. This
	// fails if a constant item is ever reintroduced ahead of them.
	svc := NewRecommendationService(nil, nil)

	feed, err := svc.GetPersonalizedFeed(context.Background(), uuid.New(), "", 10)
	require.NoError(t, err)
	for _, item := range feed.Items {
		assert.Contains(t, []string{"job", "person", "community"}, item.ItemType,
			"feed item %q is not one of the recommendation streams", item.ItemType)
	}
}
