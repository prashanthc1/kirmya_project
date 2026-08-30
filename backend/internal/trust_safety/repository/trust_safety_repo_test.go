package repository

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/trust_safety/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestTrustSafetyRepositoryInMemoryLifecycle(t *testing.T) {
	repo := NewTrustSafetyRepository(nil)
	ctx := context.Background()

	reporterID := uuid.New()
	targetID := uuid.New()

	// 1. Create Report
	rep := &models.SafetyReport{
		ID:          uuid.New(),
		ReporterID:  reporterID,
		TargetType:  "job",
		TargetID:    targetID,
		TargetTitle: "Suspicious Job Post",
		Category:    "fake_job",
		Description: "Requests payment prior to interview",
		Status:      "submitted",
		Priority:    "high",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	err := repo.CreateReport(ctx, rep)
	assert.NoError(t, err)

	// 2. Fetch Report
	fetched, err := repo.GetReportByID(ctx, rep.ID)
	assert.NoError(t, err)
	assert.NotNil(t, fetched)
	assert.Equal(t, "fake_job", fetched.Category)

	// 3. Update Report Status
	adminID := uuid.New()
	err = repo.UpdateReportStatus(ctx, rep.ID, "resolved", "Job removed and recruiter banned", &adminID)
	assert.NoError(t, err)

	// 4. Block User
	blockerID := uuid.New()
	blockedID := uuid.New()
	block := &models.UserBlock{
		ID:          uuid.New(),
		BlockerID:   blockerID,
		BlockedID:   blockedID,
		BlockedType: "user",
		Reason:      "Harassment",
		Scope:       "all",
		CreatedAt:   time.Now(),
	}
	err = repo.BlockUser(ctx, block)
	assert.NoError(t, err)

	isBlocked, err := repo.IsBlocked(ctx, blockerID, blockedID)
	assert.NoError(t, err)
	assert.True(t, isBlocked)

	// 5. Unblock User
	err = repo.UnblockUser(ctx, blockerID, blockedID)
	assert.NoError(t, err)

	isBlockedAfter, err := repo.IsBlocked(ctx, blockerID, blockedID)
	assert.NoError(t, err)
	assert.False(t, isBlockedAfter)
}
