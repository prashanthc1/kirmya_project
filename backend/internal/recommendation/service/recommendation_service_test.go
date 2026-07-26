package service

import (
	"kirmya/internal/recommendation/models"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// TestRecommendationMatchingAlgorithm checks that the scoring weights are aggregated correctly
// and that match explanations match the expected conditions.
func TestRecommendationMatchingAlgorithm(t *testing.T) {
	// Setup user profile variables
	headline := "Staff Software Engineer"
	skills := []string{"Go", "PostgreSQL", "Redis"}
	completeness := 80 // Should yield +8 points (80% of 10)

	// Setup user preferences
	pref := &models.UserJobPreferences{
		PreferredTitles:    []string{"Go Developer", "Software Engineer"},
		PreferredLocations: []string{"Dubai"},
		PreferredIndustries: []string{"Technology"},
		MinSalary:          20000,
	}

	// 1. Exact Match Job (Should match Title, Location, Salary, Industry, and all Skills)
	job := models.MockJob{
		ID:             uuid.New(),
		Title:          "Senior Go Software Engineer",
		Location:       "Dubai",
		SalaryMax:      25000,
		Industry:       "Technology",
		RequiredSkills: []string{"Go", "PostgreSQL"},
	}

	score, reasons := computeMatchScore(job, headline, skills, completeness, pref)
	
	// Score calculation details:
	// - Title matches "Software Engineer" -> +25
	// - Skills match: Go and PostgreSQL both present (2/2) -> +25
	// - Location matches "Dubai" -> +15
	// - Salary matches 25000 >= 20000 -> +15
	// - Industry matches "Technology" -> +10
	// - Completeness matches (80% of 10) -> +8
	// Total expected = 25 + 25 + 15 + 15 + 10 + 8 = 98
	assert.Equal(t, 98, score)
	assert.Contains(t, reasons, "Matches your target job titles")
	assert.Contains(t, reasons, "Matches 2 of your core skills")
	assert.Contains(t, reasons, "Located in your preferred city (Dubai)")
	assert.Contains(t, reasons, "Meets your salary expectations")

	// 2. Mismatched Job (Location, Salary and Industry mismatch)
	badJob := models.MockJob{
		ID:             uuid.New(),
		Title:          "Product Manager",
		Location:       "London",
		SalaryMax:      12000,
		Industry:       "Healthcare",
		RequiredSkills: []string{"Product Roadmap"},
	}

	score, _ = computeMatchScore(badJob, headline, skills, completeness, pref)
	// Score calculation details:
	// - Title mismatch -> 0
	// - Skills mismatch -> 0
	// - Location mismatch -> 0
	// - Salary mismatch (12000 < 20000) -> 0
	// - Industry mismatch -> 0
	// - Completeness matches (80% of 10) -> +8
	// Total expected = 8
	assert.Equal(t, 8, score)
}
