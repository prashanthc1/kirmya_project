package repository

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/ai_job_match/domain"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestMatchingRepositoryInMemoryLifecycle(t *testing.T) {
	repo := NewMatchingRepository(nil)
	ctx := context.Background()

	userID := uuid.New()
	jobID := uuid.New()
	matchID := uuid.New()

	// 1. Save Match with Score Breakdown
	match := &domain.AIJobMatch{
		ID:            matchID,
		UserID:        userID,
		JobID:         jobID,
		JobTitle:      "Senior Backend Engineer",
		CompanyName:   "Tech Innovators",
		OverallScore:  94,
		MatchTier:     domain.TierStrongMatch,
		Explanation:   "Excellent fit for Go & PostgreSQL stack.",
		MatchedSkills: []string{"Go", "PostgreSQL", "Docker"},
		MissingSkills: []string{"Kubernetes"},
		CreatedAt:     time.Now(),
	}

	breakdown := &domain.MatchingScore{
		SkillsScore:       95,
		ExperienceScore:   92,
		GoalsScore:        90,
		LocationScore:     100,
		SalaryScore:       95,
		LearningScore:     88,
		ApplicationsScore: 90,
	}

	err := repo.SaveMatch(ctx, match, breakdown)
	assert.NoError(t, err)

	// 2. Fetch Match by ID
	fetched, err := repo.GetMatchByID(ctx, matchID)
	assert.NoError(t, err)
	assert.NotNil(t, fetched)
	assert.Equal(t, 94, fetched.OverallScore)
	assert.NotNil(t, fetched.Breakdown)
	assert.Equal(t, 95, fetched.Breakdown.SkillsScore)

	// 3. Get User Matches
	userMatches, err := repo.GetUserMatches(ctx, userID)
	assert.NoError(t, err)
	assert.Len(t, userMatches, 1)
	assert.Equal(t, matchID, userMatches[0].ID)

	// 4. Save Feedback
	feedback := &domain.MatchingFeedback{
		ID:           uuid.New(),
		MatchID:      matchID,
		UserID:       userID,
		FeedbackType: "relevant",
		Notes:        "Accurate recommendation",
		CreatedAt:    time.Now(),
	}
	err = repo.SaveFeedback(ctx, feedback)
	assert.NoError(t, err)
}
