package repository

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/interview/domain"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestInterviewRepositoryLifecycle(t *testing.T) {
	repo := NewInterviewRepository(nil)
	ctx := context.Background()

	interviewID := uuid.New()
	candidateID := uuid.New()
	organizerID := uuid.New()
	jobID := uuid.New()

	// 1. Create Interview
	interview := &domain.Interview{
		ID:             interviewID,
		CandidateID:    candidateID,
		JobID:          &jobID,
		OrganizerID:    organizerID,
		Title:          "Senior Go Backend Technical Interview",
		Status:         domain.StatusScheduled,
		ScheduledStart: time.Now().Add(24 * time.Hour),
		ScheduledEnd:   time.Now().Add(25 * time.Hour),
		LocationType:   "video",
		MeetingLink:    "https://meet.kirmya.ae/tech-1",
		Notes:          "Focus on concurrency, PostgreSQL indexes, and system design.",
	}
	err := repo.CreateInterview(ctx, interview)
	require.NoError(t, err)

	// 2. Fetch Interview by ID
	fetched, err := repo.GetInterviewByID(ctx, interviewID)
	require.NoError(t, err)
	assert.NotNil(t, fetched)
	assert.Equal(t, domain.StatusScheduled, fetched.Status)

	// 3. Create Round
	roundID := uuid.New()
	round := &domain.InterviewRound{
		ID:             roundID,
		InterviewID:    interviewID,
		RoundNumber:    1,
		RoundName:      "Live Coding & System Architecture",
		RoundType:      "technical",
		Status:         domain.StatusScheduled,
		ScheduledStart: time.Now().Add(24 * time.Hour),
		ScheduledEnd:   time.Now().Add(25 * time.Hour),
	}
	err = repo.CreateRound(ctx, round)
	require.NoError(t, err)

	rounds, err := repo.GetRoundsByInterviewID(ctx, interviewID)
	require.NoError(t, err)
	assert.Len(t, rounds, 1)

	// 4. Submit Feedback
	interviewerID := uuid.New()
	feedback := &domain.InterviewFeedback{
		ID:             uuid.New(),
		RoundID:        roundID,
		InterviewID:    interviewID,
		InterviewerID:  interviewerID,
		Rating:         9,
		Recommendation: domain.RecStrongHire,
		TechnicalScore: 9,
		FeedbackText:   "Demonstrated comprehensive mastery of Go and PostgreSQL.",
		CreatedAt:      time.Now(),
	}
	err = repo.SubmitFeedback(ctx, feedback)
	require.NoError(t, err)

	feedbacks, err := repo.GetFeedbackByInterviewID(ctx, interviewID)
	require.NoError(t, err)
	assert.Len(t, feedbacks, 1)
	assert.Equal(t, domain.RecStrongHire, feedbacks[0].Recommendation)
}
