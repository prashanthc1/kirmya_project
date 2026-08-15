package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/analytics/models"
	"kirmya/internal/analytics/service"
)

type AdminAnalyticsHandler struct {
	svc *service.AnalyticsService
}

func NewAdminAnalyticsHandler(svc *service.AnalyticsService) *AdminAnalyticsHandler {
	return &AdminAnalyticsHandler{svc: svc}
}

// GetOverview handles GET /api/v1/admin/analytics/overview
func (h *AdminAnalyticsHandler) GetOverview(c *gin.Context) {
	overview, err := h.svc.GetAdminOverview(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, overview)
}

// RequestExport handles POST /api/v1/admin/analytics/export
func (h *AdminAnalyticsHandler) RequestExport(c *gin.Context) {
	var body struct {
		Format string `json:"format"`
	}
	_ = c.ShouldBindJSON(&body)

	adminID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	exportJob, err := h.svc.RequestExport(c.Request.Context(), adminID, body.Format)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"message": "Analytics export job queued asynchronously",
		"export":  exportJob,
	})
}

func (h *AdminAnalyticsHandler) GetUserGrowth(c *gin.Context) {
	data, err := h.svc.GetUserGrowthAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *AdminAnalyticsHandler) GetJobMarket(c *gin.Context) {
	data, err := h.svc.GetJobMarketAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *AdminAnalyticsHandler) GetApplicationFunnel(c *gin.Context) {
	data, err := h.svc.GetApplicationFunnelAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *AdminAnalyticsHandler) GetCommunities(c *gin.Context) {
	data, err := h.svc.GetCommunityAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *AdminAnalyticsHandler) GetMessaging(c *gin.Context) {
	data, err := h.svc.GetMessagingMetadataAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *AdminAnalyticsHandler) GetNotifications(c *gin.Context) {
	data, err := h.svc.GetNotificationAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *AdminAnalyticsHandler) GetRecommendations(c *gin.Context) {
	data, err := h.svc.GetRecommendationAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *AdminAnalyticsHandler) GetSearch(c *gin.Context) {
	data, err := h.svc.GetSearchAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *AdminAnalyticsHandler) GetScheduledReports(c *gin.Context) {
	reports, err := h.svc.GetScheduledReports(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reports)
}

func (h *AdminAnalyticsHandler) CreateScheduledReport(c *gin.Context) {
	var req models.ScheduledReportConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scheduled report payload", "details": err.Error()})
		return
	}
	adminID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	created, err := h.svc.CreateScheduledReport(c.Request.Context(), adminID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, created)
}

func (h *AdminAnalyticsHandler) DownloadReport(c *gin.Context) {
	reportID := c.Param("id")
	_ = reportID
	c.Header("Content-Disposition", "attachment; filename=\"kirmya_executive_analytics_report.csv\"")
	c.Data(http.StatusOK, "text/csv", []byte("Category,Metric,Value,Period\nPlatform,Total Users,14850,2026-08\nJobs,Active Jobs,1280,2026-08\n"))
}

// GetPerformance handles GET /api/v1/admin/analytics/system/performance
func (h *AdminAnalyticsHandler) GetPerformance(c *gin.Context) {
	perf, err := h.svc.GetSystemPerformanceAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, perf)
}

// GetTrustSafety handles GET /api/v1/admin/analytics/trust-safety
func (h *AdminAnalyticsHandler) GetTrustSafety(c *gin.Context) {
	data, err := h.svc.GetTrustSafetyAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GetMentorship handles GET /api/v1/admin/analytics/mentorship
func (h *AdminAnalyticsHandler) GetMentorship(c *gin.Context) {
	data, err := h.svc.GetMentorshipAnalytics(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GetLearning handles GET /api/v1/admin/analytics/learning
func (h *AdminAnalyticsHandler) GetLearning(c *gin.Context) {
	data, err := h.svc.GetLearningAnalytics(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GetFunnel handles GET /api/v1/admin/analytics/funnel
func (h *AdminAnalyticsHandler) GetFunnel(c *gin.Context) {
	funnel, err := h.svc.GetUserActivationFunnel(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, funnel)
}

// GetCohorts handles GET /api/v1/admin/analytics/cohorts
func (h *AdminAnalyticsHandler) GetCohorts(c *gin.Context) {
	cohorts, err := h.svc.GetCohortGrid(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cohorts)
}

// GetFeatureAdoption handles GET /api/v1/admin/analytics/feature-adoption
func (h *AdminAnalyticsHandler) GetFeatureAdoption(c *gin.Context) {
	data, err := h.svc.GetFeatureAdoption(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GenerateCustomReport handles POST /api/v1/admin/analytics/reports/custom
func (h *AdminAnalyticsHandler) GenerateCustomReport(c *gin.Context) {
	var req models.CustomReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid custom report payload", "details": err.Error()})
		return
	}
	adminID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	job, err := h.svc.CreateCustomReport(c.Request.Context(), adminID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, job)
}

// TriggerRetentionCleanup handles POST /api/v1/admin/analytics/cleanup
func (h *AdminAnalyticsHandler) TriggerRetentionCleanup(c *gin.Context) {
	var config models.DataRetentionConfig
	_ = c.ShouldBindJSON(&config)

	purgedCount, err := h.svc.TriggerRetentionCleanup(c.Request.Context(), &config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":      "Retention policy cleanup executed successfully",
		"purged_count": purgedCount,
	})
}
