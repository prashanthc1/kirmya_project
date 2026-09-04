package http

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"kirmya/internal/admin/models"
	"kirmya/internal/admin/repository"
	"kirmya/internal/admin/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestRouter() (*gin.Engine, *AdminHandler, *service.AdminService, uuid.UUID) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	repo := repository.NewAdminRepository(nil)
	svc := service.NewAdminService(repo)
	handler := NewAdminHandler(svc)

	adminID := uuid.New()

	// Stand in for the auth middleware, populating the context keys the RBAC
	// middleware actually reads. This previously set "userRole", which nothing
	// reads: the suite passed only because RegisterRoutes left the /admin group
	// unguarded when given no AuthMiddleware, so these tests were asserting
	// against an open surface while appearing to authenticate as an admin.
	r.Use(func(c *gin.Context) {
		c.Set("userID", adminID)
		c.Set("role", "super_admin")
		c.Next()
	})

	api := r.Group("/api/v1")
	RegisterRoutes(api, handler, nil)

	return r, handler, svc, adminID
}

func TestAdminHandlerDashboard(t *testing.T) {
	r, _, _, _ := setupTestRouter()

	req, _ := http.NewRequest("GET", "/api/v1/admin/dashboard", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp models.AdminDashboardStats
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)
	assert.Greater(t, resp.TotalUsers, int64(0))
}

func TestAdminHandlerUsers(t *testing.T) {
	r, _, _, _ := setupTestRouter()

	// List users
	req, _ := http.NewRequest("GET", "/api/v1/admin/users?limit=10", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Get user by ID
	uID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	req, _ = http.NewRequest("GET", "/api/v1/admin/users/"+uID.String(), nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Update user status missing reason -> 400
	payloadBad := map[string]string{"status": "Suspended"}
	bodyBad, _ := json.Marshal(payloadBad)
	req, _ = http.NewRequest("PUT", "/api/v1/admin/users/"+uID.String()+"/status", bytes.NewBuffer(bodyBad))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// Update user status valid
	payloadOk := map[string]string{"status": "Suspended", "reason": "Suspicious login attempt"}
	bodyOk, _ := json.Marshal(payloadOk)
	req, _ = http.NewRequest("PUT", "/api/v1/admin/users/"+uID.String()+"/status", bytes.NewBuffer(bodyOk))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAdminHandlerCompaniesAndJobs(t *testing.T) {
	r, _, _, _ := setupTestRouter()

	// List companies
	req, _ := http.NewRequest("GET", "/api/v1/admin/companies", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Update company status
	cID := uuid.New()
	compBody, _ := json.Marshal(map[string]string{"status": "Suspended", "reason": "Unregistered company"})
	req, _ = http.NewRequest("PUT", "/api/v1/admin/companies/"+cID.String()+"/status", bytes.NewBuffer(compBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// List jobs
	req, _ = http.NewRequest("GET", "/api/v1/admin/jobs", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Moderate job
	jID := uuid.New()
	jobBody, _ := json.Marshal(map[string]string{"action": "Approve", "reason": "Listing meets guidelines"})
	req, _ = http.NewRequest("POST", "/api/v1/admin/jobs/"+jID.String()+"/moderate", bytes.NewBuffer(jobBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAdminHandlerReportsAndModeration(t *testing.T) {
	r, _, _, _ := setupTestRouter()

	// List reports
	req, _ := http.NewRequest("GET", "/api/v1/admin/reports", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Resolve report
	repID := uuid.New()
	repBody, _ := json.Marshal(map[string]string{"resolution": "Resolved", "notes": "Listing removed"})
	req, _ = http.NewRequest("POST", "/api/v1/admin/reports/"+repID.String()+"/resolve", bytes.NewBuffer(repBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Moderation queue
	req, _ = http.NewRequest("GET", "/api/v1/admin/moderation/queue", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Verifications
	req, _ = http.NewRequest("GET", "/api/v1/admin/verifications", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Audit logs
	req, _ = http.NewRequest("GET", "/api/v1/admin/audit-logs", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Security events
	req, _ = http.NewRequest("GET", "/api/v1/admin/security-events", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAdminHandlerFeatureFlagsAndSettings(t *testing.T) {
	r, _, _, _ := setupTestRouter()

	// List flags
	req, _ := http.NewRequest("GET", "/api/v1/admin/feature-flags", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Create flag
	flagBody, _ := json.Marshal(models.CreateFeatureFlagPayload{
		Name:              "experimental_matching",
		Description:       "Test matching rollout",
		IsEnabled:         true,
		Environment:       "production",
		RolloutPercentage: 100,
	})
	req, _ = http.NewRequest("POST", "/api/v1/admin/feature-flags", bytes.NewBuffer(flagBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Settings
	req, _ = http.NewRequest("GET", "/api/v1/admin/settings", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Announcements
	annBody, _ := json.Marshal(models.CreateAnnouncementPayload{
		Title:    "Scheduled Maintenance",
		Content:  "System upgrade tonight at 02:00 UTC",
		Audience: "All Active Users",
		Priority: "High",
		Channels: []string{"in_app"},
	})
	req, _ = http.NewRequest("POST", "/api/v1/admin/announcements", bytes.NewBuffer(annBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestAdminHandlerSystemOperations(t *testing.T) {
	r, handler, _, adminID := setupTestRouter()

	// Background jobs list
	req, _ := http.NewRequest("GET", "/api/v1/admin/system/jobs", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Retry job
	mockJobID := "00000000-0000-0000-0000-000000000001"
	req, _ = http.NewRequest("POST", "/api/v1/admin/system/jobs/"+mockJobID+"/retry", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Trigger job handler
	trigBody, _ := json.Marshal(map[string]interface{}{"jobName": "manual_digest_trigger", "queue": "notifications"})
	trigRec := httptest.NewRecorder()
	trigCtx, _ := gin.CreateTestContext(trigRec)
	trigCtx.Request, _ = http.NewRequest("POST", "/admin/system/jobs/trigger", bytes.NewBuffer(trigBody))
	trigCtx.Request.Header.Set("Content-Type", "application/json")
	trigCtx.Set("userID", adminID)
	handler.TriggerBackgroundJob(trigCtx)
	assert.Equal(t, http.StatusOK, trigRec.Code)

	// Incidents list
	req, _ = http.NewRequest("GET", "/api/v1/admin/incidents", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Create incident
	incBody, _ := json.Marshal(models.CreateIncidentPayload{
		Title:       "Elevated Queue Latency",
		Description: "Worker pool capacity limit reached",
		Severity:    "Major",
	})
	req, _ = http.NewRequest("POST", "/api/v1/admin/incidents", bytes.NewBuffer(incBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Maintenance mode get & update
	req, _ = http.NewRequest("GET", "/api/v1/admin/maintenance", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	maintBody, _ := json.Marshal(models.UpdateMaintenanceModePayload{
		IsEnabled: true,
		Reason:    "DB index rebalancing",
	})
	req, _ = http.NewRequest("PUT", "/api/v1/admin/maintenance", bytes.NewBuffer(maintBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAdminHandlerImpersonationAndRoles(t *testing.T) {
	r, handler, _, _ := setupTestRouter()

	targetUID := uuid.New()

	// Impersonation request
	impBody, _ := json.Marshal(map[string]string{
		"reason": "Support ticket #1029 investigation",
	})
	req, _ := http.NewRequest("POST", "/api/v1/admin/users/"+targetUID.String()+"/impersonate", bytes.NewBuffer(impBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	var sess models.UserImpersonationSession
	_ = json.Unmarshal(w.Body.Bytes(), &sess)
	assert.Equal(t, targetUID, sess.UserID)

	// List impersonation sessions via handler directly
	listRec := httptest.NewRecorder()
	listCtx, _ := gin.CreateTestContext(listRec)
	listCtx.Request, _ = http.NewRequest("GET", "/admin/impersonations?limit=10", nil)
	handler.ListImpersonationSessions(listCtx)
	assert.Equal(t, http.StatusOK, listRec.Code)

	// Revoke session
	req, _ = http.NewRequest("POST", "/api/v1/admin/impersonation/"+sess.ID.String()+"/revoke", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// List roles
	req, _ = http.NewRequest("GET", "/api/v1/admin/roles", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Assign role
	roleBody, _ := json.Marshal(models.AssignUserRolePayload{
		UserID:   targetUID,
		RoleCode: "content_moderator",
		Reason:   "Promoted to moderation staff",
	})
	req, _ = http.NewRequest("POST", "/api/v1/admin/roles/assign", bytes.NewBuffer(roleBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAdminHandlerObservability(t *testing.T) {
	r, _, _, _ := setupTestRouter()

	endpoints := []string{
		"/api/v1/admin/observability",
		"/api/v1/admin/observability/health",
		"/api/v1/admin/observability/metrics",
		"/api/v1/admin/observability/errors",
		"/api/v1/admin/observability/incidents",
		"/api/v1/admin/observability/dependencies",
	}

	for _, ep := range endpoints {
		req, _ := http.NewRequest("GET", ep, nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code, "Endpoint %s should return 200", ep)
	}
}

func TestAdminMiddlewareRequirePermission(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	repo := repository.NewAdminRepository(nil)
	svc := service.NewAdminService(repo)

	// Unauthenticated router
	r.GET("/protected-unauth", func(c *gin.Context) {
		// no userID set
	}, RequirePermission(svc, "users.suspend"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req, _ := http.NewRequest("GET", "/protected-unauth", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	// Authenticated router with restricted user
	restrictedUserID := uuid.New()
	_ = repo.AssignUserRole(context.Background(), restrictedUserID, "analytics_admin")

	r.GET("/protected-restricted", func(c *gin.Context) {
		c.Set("userID", restrictedUserID)
	}, RequirePermission(svc, "users.suspend"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req, _ = http.NewRequest("GET", "/protected-restricted", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)
}
