package repository

import (
	"context"
	"kirmya/internal/admin/models"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAdminRepositoryAuditLogs(t *testing.T) {
	repo := NewAdminRepository(nil)
	ctx := context.Background()

	adminID := uuid.New()
	log := &models.AdminAuditLog{
		ID:         uuid.New(),
		AdminID:    adminID,
		AdminEmail: "security@kirmya.com",
		RoleCode:   "super_admin",
		Action:     "USER_SUSPEND",
		TargetType: "User",
		TargetID:   "u-123",
		Reason:     "Policy violation",
		IPAddress:  "192.168.1.50",
		UserAgent:  "AdminConsole/1.0",
		CreatedAt:  time.Now(),
	}

	err := repo.CreateAuditLog(ctx, log)
	assert.NoError(t, err)

	logs, err := repo.ListAuditLogs(ctx, "SUSPEND", adminID.String(), "User", 10, 0)
	assert.NoError(t, err)
	require.NotEmpty(t, logs)
	assert.Equal(t, "USER_SUSPEND", logs[0].Action)
	assert.Equal(t, "User", logs[0].TargetType)
}

func TestAdminRepositoryRolesAndPermissions(t *testing.T) {
	repo := NewAdminRepository(nil)
	ctx := context.Background()

	userID := uuid.New()
	roles, err := repo.GetUserRoles(ctx, userID)
	assert.NoError(t, err)
	assert.NotEmpty(t, roles)

	// Default permissions
	perms, err := repo.GetUserPermissions(ctx, userID)
	assert.NoError(t, err)
	assert.Contains(t, perms, "super_admin")

	// Assign custom role
	err = repo.AssignUserRole(ctx, userID, "content_moderator")
	assert.NoError(t, err)

	rolesAfter, err := repo.GetUserRoles(ctx, userID)
	assert.NoError(t, err)
	assert.Contains(t, rolesAfter, "content_moderator")

	// Get predefined roles
	allRoles, err := repo.GetRoles(ctx)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(allRoles), 5)
}

func TestAdminRepositoryDashboardAndUsers(t *testing.T) {
	repo := NewAdminRepository(nil)
	ctx := context.Background()

	stats, err := repo.GetDashboardStats(ctx)
	assert.NoError(t, err)
	assert.NotNil(t, stats)
	assert.Greater(t, stats.TotalUsers, int64(0))

	users, err := repo.ListUsers(ctx, "Tariq", "Active", 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, users)

	uID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	err = repo.UpdateUserStatus(ctx, uID, "Suspended")
	assert.NoError(t, err)
}

func TestAdminRepositoryCompaniesAndJobs(t *testing.T) {
	repo := NewAdminRepository(nil)
	ctx := context.Background()

	companies, err := repo.ListCompanies(ctx, "TechCorp", "Active", 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, companies)

	err = repo.UpdateCompanyStatus(ctx, uuid.New(), "Verified")
	assert.NoError(t, err)

	jobs, err := repo.ListJobs(ctx, "Go", "Active", 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, jobs)

	err = repo.ModerateJob(ctx, uuid.New(), "active")
	assert.NoError(t, err)
}

func TestAdminRepositoryReportsAndModeration(t *testing.T) {
	repo := NewAdminRepository(nil)
	ctx := context.Background()

	reports, err := repo.ListReports(ctx, "New", "Critical", 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, reports)

	rep, err := repo.GetReportByID(ctx, reports[0].ID)
	assert.NoError(t, err)
	assert.Equal(t, reports[0].ID, rep.ID)

	err = repo.ResolveReport(ctx, rep.ID, "Resolved", "Content removed", uuid.New())
	assert.NoError(t, err)

	cases, err := repo.ListModerationQueue(ctx, "", "", 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, cases)

	verifs, err := repo.ListVerifications(ctx, "", 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, verifs)

	secEvents, err := repo.ListSecurityEvents(ctx, "", 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, secEvents)
}

func TestAdminRepositoryFeatureFlags(t *testing.T) {
	repo := NewAdminRepository(nil)
	ctx := context.Background()

	flags, err := repo.ListFeatureFlags(ctx)
	assert.NoError(t, err)
	assert.NotEmpty(t, flags)

	newFlag := &models.FeatureFlag{
		ID:                uuid.New(),
		Name:              "new_feature_test",
		Description:       "Test rollout",
		IsEnabled:         true,
		Environment:       "staging",
		RolloutPercentage: 50,
	}

	err = repo.UpsertFeatureFlag(ctx, newFlag)
	assert.NoError(t, err)
}

func TestAdminRepositoryBackgroundJobsAndIncidents(t *testing.T) {
	repo := NewAdminRepository(nil)
	ctx := context.Background()

	// Trigger job
	job, err := repo.TriggerBackgroundJob(ctx, "test_task", "high", map[string]interface{}{"retry": true})
	require.NoError(t, err)
	assert.Equal(t, "Queued", job.Status)

	// List jobs
	jobs, err := repo.ListBackgroundJobs(ctx, "Queued", "high", 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, jobs)

	// Get job by ID
	fetchedJob, err := repo.GetBackgroundJobByID(ctx, job.ID)
	assert.NoError(t, err)
	assert.Equal(t, job.ID, fetchedJob.ID)

	// Update job status
	err = repo.UpdateBackgroundJobStatus(ctx, job.ID, "Completed", 1, "")
	assert.NoError(t, err)

	// Create incident
	inc := &models.IncidentItem{
		ID:          uuid.New(),
		Title:       "Redis Cache Eviction Surge",
		Description: "Memory saturation",
		Severity:    "Major",
		Status:      "Open",
	}
	err = repo.CreateIncident(ctx, inc)
	assert.NoError(t, err)

	// List incidents
	incidents, err := repo.ListIncidents(ctx, "Open", "Major", 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, incidents)

	// Update incident
	now := time.Now()
	err = repo.UpdateIncident(ctx, inc.ID, "Resolved", &now)
	assert.NoError(t, err)
}

func TestAdminRepositoryMaintenanceAndImpersonation(t *testing.T) {
	repo := NewAdminRepository(nil)
	ctx := context.Background()

	cfg, err := repo.GetMaintenanceModeConfig(ctx)
	assert.NoError(t, err)
	assert.False(t, cfg.IsEnabled)

	adminID := uuid.New()
	err = repo.UpdateMaintenanceModeConfig(ctx, &models.MaintenanceModeConfig{
		IsEnabled: true,
		Reason:    "Scheduled maintenance",
		EnabledBy: &adminID,
		UpdatedAt: time.Now(),
	})
	assert.NoError(t, err)

	// Impersonation
	session := &models.UserImpersonationSession{
		ID:        uuid.New(),
		UserID:    uuid.New(),
		AdminID:   adminID,
		Reason:    "Support ticket investigation",
		Token:     "token-xyz",
		ExpiresAt: time.Now().Add(15 * time.Minute),
		IsActive:  true,
		CreatedAt: time.Now(),
	}

	err = repo.CreateImpersonationSession(ctx, session)
	assert.NoError(t, err)

	sessions, err := repo.ListImpersonationSessions(ctx, adminID.String(), 10, 0)
	assert.NoError(t, err)
	assert.NotEmpty(t, sessions)

	fetchedSess, err := repo.GetImpersonationSession(ctx, session.ID)
	assert.NoError(t, err)
	assert.Equal(t, session.ID, fetchedSess.ID)

	err = repo.RevokeImpersonationSession(ctx, session.ID)
	assert.NoError(t, err)
}
