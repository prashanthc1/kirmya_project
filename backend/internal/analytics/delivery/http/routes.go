package http

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, handler interface{}) {
	if h, ok := handler.(*AnalyticsHandler); ok {
		RegisterAnalyticsRoutes(router, h)
	} else {
		RegisterAnalyticsRoutes(router, nil)
	}
	RegisterAdminAnalyticsRoutes(router, nil)
}

func RegisterAnalyticsRoutes(router *gin.RouterGroup, handler *AnalyticsHandler) {
	var ingestEvent, getUserAnalytics, getRecruiterAnalytics, getCompanyAnalytics gin.HandlerFunc
	if handler != nil {
		ingestEvent = handler.IngestEvent
		getUserAnalytics = handler.GetUserAnalytics
		getRecruiterAnalytics = handler.GetRecruiterAnalytics
		getCompanyAnalytics = handler.GetCompanyAnalytics
	} else {
		dummy := func(c *gin.Context) {}
		ingestEvent, getUserAnalytics, getRecruiterAnalytics, getCompanyAnalytics = dummy, dummy, dummy, dummy
	}

	internalGroup := router.Group("/internal/analytics")
	{
		internalGroup.POST("/events", ingestEvent)
	}

	analytics := router.Group("/analytics")
	{
		analytics.GET("/profile", getUserAnalytics)
		analytics.GET("/jobs", getUserAnalytics)
		analytics.GET("/applications", getUserAnalytics)
		analytics.GET("/network", getUserAnalytics)
		analytics.GET("/content", getUserAnalytics)
		analytics.GET("/career", getUserAnalytics)
	}

	recruiterAnalytics := router.Group("/recruiter/analytics")
	{
		recruiterAnalytics.GET("/overview", getRecruiterAnalytics)
		recruiterAnalytics.GET("/jobs", getRecruiterAnalytics)
		recruiterAnalytics.GET("/candidates", getRecruiterAnalytics)
	}

	companyAnalytics := router.Group("/company/analytics")
	{
		companyAnalytics.GET("/overview", getCompanyAnalytics)
		companyAnalytics.GET("/jobs", getCompanyAnalytics)
		companyAnalytics.GET("/applications", getCompanyAnalytics)
		companyAnalytics.GET("/candidates", getCompanyAnalytics)
	}

	communityAnalytics := router.Group("/communities")
	{
		communityAnalytics.GET("/:id/analytics", getCompanyAnalytics)
	}
}

func RegisterAdminAnalyticsRoutes(router *gin.RouterGroup, handler *AdminAnalyticsHandler) {
	var getOverview, requestExport gin.HandlerFunc
	if handler != nil {
		getOverview = handler.GetOverview
		requestExport = handler.RequestExport
	} else {
		dummy := func(c *gin.Context) {}
		getOverview, requestExport = dummy, dummy
	}

	adminAnalytics := router.Group("/admin/analytics")
	{
		adminAnalytics.GET("/overview", getOverview)
		adminAnalytics.GET("/users", getOverview)
		adminAnalytics.GET("/jobs", getOverview)
		adminAnalytics.GET("/applications", getOverview)
		adminAnalytics.GET("/recruiters", getOverview)
		adminAnalytics.GET("/companies", getOverview)
		adminAnalytics.GET("/communities", getOverview)
		adminAnalytics.GET("/messaging", getOverview)
		adminAnalytics.GET("/ai", getOverview)
		adminAnalytics.GET("/search", getOverview)
		adminAnalytics.GET("/support", getOverview)
		adminAnalytics.GET("/safety", getOverview)
		adminAnalytics.GET("/system", getOverview)
		adminAnalytics.GET("/events", getOverview)
		adminAnalytics.POST("/export", requestExport)
	}
}
