package service

import (
	"context"
	"kirmya/internal/admin/models"
	"kirmya/internal/admin/repository"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestAdminRBACCheckPermission(t *testing.T) {
	repo := repository.NewAdminRepository(nil)
	svc := NewAdminService(repo)

	adminID := uuid.New()

	// With nil DB, GetUserPermissions returns default permissions including users.read
	hasPerm, err := svc.CheckPermission(context.Background(), adminID, "users.read")
	assert.NoError(t, err)
	assert.True(t, hasPerm)

	// Test required permission that is not in list
	hasNonExistent, err := svc.CheckPermission(context.Background(), adminID, "invalid_permission")
	assert.NoError(t, err)
	assert.False(t, hasNonExistent)
}

func TestAdminAuditLoggingAndStatusUpdate(t *testing.T) {
	repo := repository.NewAdminRepository(nil)
	svc := NewAdminService(repo)

	adminID := uuid.New()
	targetUserID := uuid.New()

	// Verify error when reason is empty
	err := svc.UpdateUserStatus(context.Background(), adminID, targetUserID, "Suspended", "", "127.0.0.1", "Mozilla/5.0")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "reason is required")

	// Verify success when reason is provided
	err = svc.UpdateUserStatus(context.Background(), adminID, targetUserID, "Suspended", "Suspicious spam activity", "127.0.0.1", "Mozilla/5.0")
	assert.NoError(t, err)
}

func TestAdminJobModerationAndReports(t *testing.T) {
	repo := repository.NewAdminRepository(nil)
	svc := NewAdminService(repo)

	adminID := uuid.New()
	jobID := uuid.New()

	err := svc.ModerateJob(context.Background(), adminID, jobID, "Approve", "Job passes trust and safety policies", "127.0.0.1", "Mozilla/5.0")
	assert.NoError(t, err)

	reportID := uuid.New()
	err = svc.ResolveReport(context.Background(), adminID, reportID, "Resolve", "Job listing removed for policy violation", "127.0.0.1", "Mozilla/5.0")
	assert.NoError(t, err)
}

func TestAssistiveAIReportClassification(t *testing.T) {
	repo := repository.NewAdminRepository(nil)
	svc := NewAdminService(repo)

	category, confidence, reasoning := svc.ClassifyContentReport(context.Background(), "Remote Job", "Send wire transfer fee to start work")
	assert.Equal(t, "Job Scam", category)
	assert.Greater(t, confidence, 0.9)
	assert.Contains(t, reasoning, "wire scam")

	riskScore, err := svc.CalculateRiskScore(context.Background(), "User", uuid.New().String())
	assert.NoError(t, err)
	assert.NotNil(t, riskScore)
	assert.Equal(t, "High", riskScore.RiskLevel)
}

func TestFeatureFlagUpdates(t *testing.T) {
	repo := repository.NewAdminRepository(nil)
	svc := NewAdminService(repo)

	adminID := uuid.New()
	flag := &models.FeatureFlag{
		ID:                uuid.New(),
		Name:              "ai_moderation_v2",
		IsEnabled:         true,
		Environment:       "production",
		RolloutPercentage: 100,
	}

	err := svc.UpdateFeatureFlag(context.Background(), adminID, flag, "127.0.0.1", "Mozilla/5.0")
	assert.NoError(t, err)
}
