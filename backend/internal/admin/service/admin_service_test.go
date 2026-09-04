package service

import (
	"context"
	"kirmya/internal/admin/models"
	"kirmya/internal/admin/repository"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAdminRBACCheckPermission(t *testing.T) {
	repo := repository.NewAdminRepository(nil)
	svc := NewAdminService(repo)

	adminID := uuid.New()

	// Default unassigned permissions include super_admin / wildcard
	hasPerm, err := svc.CheckPermission(context.Background(), adminID, "users.read")
	assert.NoError(t, err)
	assert.True(t, hasPerm)

	// Test user assigned explicit support_admin role
	supportUserID := uuid.New()
	err = svc.AssignUserRole(context.Background(), adminID, supportUserID, "support_admin", "Grant support admin role", "127.0.0.1", "Mozilla/5.0")
	assert.NoError(t, err)

	hasImpersonate, err := svc.CheckPermission(context.Background(), supportUserID, "users.impersonate")
	assert.NoError(t, err)
	assert.True(t, hasImpersonate)

	hasDelete, err := svc.CheckPermission(context.Background(), supportUserID, "system_jobs.retry")
	assert.NoError(t, err)
	assert.False(t, hasDelete)

	// Test CheckAnyPermission
	hasAny, err := svc.CheckAnyPermission(context.Background(), supportUserID, "users.impersonate", "non_existent_perm")
	assert.NoError(t, err)
	assert.True(t, hasAny)
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

	// Verify company status update
	companyID := uuid.New()
	err = svc.UpdateCompanyStatus(context.Background(), adminID, companyID, "Suspended", "Unverified trade license", "127.0.0.1", "Mozilla/5.0")
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

	flags, err := svc.ListFeatureFlags(context.Background())
	assert.NoError(t, err)
	assert.NotEmpty(t, flags)
}

func TestSupportImpersonationSession(t *testing.T) {
	repo := repository.NewAdminRepository(nil)
	svc := NewAdminService(repo)

	adminID := uuid.New()
	targetUserID := uuid.New()

	// Enforce reason requirement
	_, err := svc.CreateImpersonationSession(context.Background(), adminID, targetUserID, "", "127.0.0.1", "Mozilla/5.0")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "reason is strictly required")

	// Create valid impersonation session
	session, err := svc.CreateImpersonationSession(context.Background(), adminID, targetUserID, "Customer support ticket #8420 escalation", "127.0.0.1", "Mozilla/5.0")
	require.NoError(t, err)
	require.NotNil(t, session)

	assert.Equal(t, targetUserID, session.UserID)
	assert.Equal(t, adminID, session.AdminID)
	assert.NotEmpty(t, session.Token)
	assert.True(t, session.IsActive)
	assert.WithinDuration(t, time.Now().Add(15*time.Minute), session.ExpiresAt, 5*time.Second)

	// Revoke session
	err = svc.RevokeImpersonationSession(context.Background(), adminID, session.ID, "Ticket resolved", "127.0.0.1", "Mozilla/5.0")
	assert.NoError(t, err)
}

func TestBackgroundJobRetries(t *testing.T) {
	repo := repository.NewAdminRepository(nil)
	svc := NewAdminService(repo)

	adminID := uuid.New()
	mockJobID := uuid.MustParse("00000000-0000-0000-0000-000000000001")

	jobs, err := svc.ListBackgroundJobs(context.Background(), "", "", 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, jobs)

	job, err := svc.GetBackgroundJobByID(context.Background(), mockJobID)
	require.NoError(t, err)
	assert.Equal(t, "Failed", job.Status)
	initialRetryCount := job.RetryCount

	// Perform retry dispatch
	retriedJob, err := svc.RetryBackgroundJob(context.Background(), adminID, mockJobID, "Manual operator retry after SMTP gateway recovery", "127.0.0.1", "Mozilla/5.0")
	require.NoError(t, err)
	assert.Equal(t, "Queued", retriedJob.Status)
	assert.Equal(t, initialRetryCount+1, retriedJob.RetryCount)
}

func TestMaintenanceMode(t *testing.T) {
	repo := repository.NewAdminRepository(nil)
	svc := NewAdminService(repo)

	adminID := uuid.New()

	// Verify initial maintenance state
	initialCfg, err := svc.GetMaintenanceModeConfig(context.Background())
	require.NoError(t, err)
	assert.False(t, initialCfg.IsEnabled)

	// Verify reason required
	_, err = svc.UpdateMaintenanceMode(context.Background(), adminID, true, "", nil, "127.0.0.1", "Mozilla/5.0")
	assert.Error(t, err)

	// Enable maintenance mode
	sched := time.Now().Add(1 * time.Hour)
	updatedCfg, err := svc.UpdateMaintenanceMode(context.Background(), adminID, true, "DB schema migration release v2.4", &sched, "127.0.0.1", "Mozilla/5.0")
	require.NoError(t, err)
	assert.True(t, updatedCfg.IsEnabled)
	assert.Equal(t, "DB schema migration release v2.4", updatedCfg.Reason)
	assert.Equal(t, &adminID, updatedCfg.EnabledBy)
}

func TestIncidentManagement(t *testing.T) {
	repo := repository.NewAdminRepository(nil)
	svc := NewAdminService(repo)

	adminID := uuid.New()

	// Create new incident
	inc, err := svc.CreateIncident(context.Background(), adminID, "Database Failover Triggered", "Primary PG pool disconnected", "Critical", "127.0.0.1", "Mozilla/5.0")
	require.NoError(t, err)
	assert.Equal(t, "Open", inc.Status)
	assert.Equal(t, "Critical", inc.Severity)

	// List incidents
	incidents, err := svc.ListIncidents(context.Background(), "", "", 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, incidents)

	// Update incident to Resolved
	resolvedInc, err := svc.UpdateIncident(context.Background(), adminID, inc.ID, "Resolved", "Failover completed successfully to secondary node", "127.0.0.1", "Mozilla/5.0")
	require.NoError(t, err)
	assert.Equal(t, "Resolved", resolvedInc.Status)
	assert.NotNil(t, resolvedInc.ResolvedAt)
}

func TestGetSystemHealth(t *testing.T) {
	repo := repository.NewAdminRepository(nil)
	svc := NewAdminService(repo)

	health, err := svc.GetSystemHealth(context.Background())
	require.NoError(t, err)
	assert.Equal(t, "Healthy", health.APIStatus)
	assert.Equal(t, "Healthy", health.DatabaseStatus)
	assert.Equal(t, "Healthy", health.RedisStatus)
	assert.NotNil(t, health.Metrics)
}

func TestTriggerBackgroundJobAndListImpersonationSessions(t *testing.T) {
	repo := repository.NewAdminRepository(nil)
	svc := NewAdminService(repo)
	adminID := uuid.New()

	// Test TriggerBackgroundJob
	job, err := svc.TriggerBackgroundJob(context.Background(), adminID, "nightly_prune_task", "maintenance", map[string]interface{}{"dryRun": false}, "127.0.0.1", "AdminConsole/1.0")
	require.NoError(t, err)
	assert.Equal(t, "nightly_prune_task", job.Name)
	assert.Equal(t, "maintenance", job.Queue)
	assert.Equal(t, "Queued", job.Status)

	// Test ListImpersonationSessions
	sessions, err := svc.ListImpersonationSessions(context.Background(), adminID.String(), 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, sessions)
}
