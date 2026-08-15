package http

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, analyticsHandler interface{}, adminHandler *AdminAnalyticsHandler) {
	if h, ok := analyticsHandler.(*AnalyticsHandler); ok {
		RegisterAnalyticsRoutes(router, h)
	} else {
		RegisterAnalyticsRoutes(router, nil)
	}
	RegisterAdminAnalyticsRoutes(router, adminHandler)
}

func RegisterAnalyticsRoutes(router *gin.RouterGroup, handler *AnalyticsHandler) {
	var ingestEvent, getUserAnalytics, getRecruiterAnalytics, getCompanyAnalytics gin.HandlerFunc
	var getUserConsent, updateUserConsent, getPersonalFunnel, getPersonalMentorship, getPersonalLearning gin.HandlerFunc

	if handler != nil {
		ingestEvent = handler.IngestEvent
		getUserAnalytics = handler.GetUserAnalytics
		getRecruiterAnalytics = handler.GetRecruiterAnalytics
		getCompanyAnalytics = handler.GetCompanyAnalytics
		getUserConsent = handler.GetUserConsent
		updateUserConsent = handler.UpdateUserConsent
		getPersonalFunnel = handler.GetPersonalFunnel
		getPersonalMentorship = handler.GetPersonalMentorshipAnalytics
		getPersonalLearning = handler.GetPersonalLearningAnalytics
	} else {
		dummy := func(c *gin.Context) {}
		ingestEvent, getUserAnalytics, getRecruiterAnalytics, getCompanyAnalytics = dummy, dummy, dummy, dummy
		getUserConsent, updateUserConsent, getPersonalFunnel, getPersonalMentorship, getPersonalLearning = dummy, dummy, dummy, dummy, dummy
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
		analytics.GET("/me", getUserAnalytics)
		analytics.GET("/consent", getUserConsent)
		analytics.PUT("/consent", updateUserConsent)
		analytics.GET("/funnel", getPersonalFunnel)
		analytics.GET("/mentorship", getPersonalMentorship)
		analytics.GET("/learning", getPersonalLearning)
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
	var getOverview, getUserGrowth, getJobMarket, getAppFunnel, getCommunities, getMessaging, getNotifications, getRecommendations, getSearch, requestExport, getScheduled, createScheduled, downloadReport gin.HandlerFunc
	var getPerformance, getTrustSafety, getMentorship, getLearning, getFunnel, getCohorts, getFeatureAdoption, generateCustomReport, triggerCleanup gin.HandlerFunc

	if handler != nil {
		getOverview = handler.GetOverview
		getUserGrowth = handler.GetUserGrowth
		getJobMarket = handler.GetJobMarket
		getAppFunnel = handler.GetApplicationFunnel
		getCommunities = handler.GetCommunities
		getMessaging = handler.GetMessaging
		getNotifications = handler.GetNotifications
		getRecommendations = handler.GetRecommendations
		getSearch = handler.GetSearch
		requestExport = handler.RequestExport
		getScheduled = handler.GetScheduledReports
		createScheduled = handler.CreateScheduledReport
		downloadReport = handler.DownloadReport
		getPerformance = handler.GetPerformance
		getTrustSafety = handler.GetTrustSafety
		getMentorship = handler.GetMentorship
		getLearning = handler.GetLearning
		getFunnel = handler.GetFunnel
		getCohorts = handler.GetCohorts
		getFeatureAdoption = handler.GetFeatureAdoption
		generateCustomReport = handler.GenerateCustomReport
		triggerCleanup = handler.TriggerRetentionCleanup
	} else {
		dummy := func(c *gin.Context) {}
		getOverview, getUserGrowth, getJobMarket, getAppFunnel, getCommunities, getMessaging, getNotifications, getRecommendations, getSearch, requestExport, getScheduled, createScheduled, downloadReport = dummy, dummy, dummy, dummy, dummy, dummy, dummy, dummy, dummy, dummy, dummy, dummy, dummy
		getPerformance, getTrustSafety, getMentorship, getLearning, getFunnel, getCohorts, getFeatureAdoption, generateCustomReport, triggerCleanup = dummy, dummy, dummy, dummy, dummy, dummy, dummy, dummy, dummy
	}

	adminAnalytics := router.Group("/admin/analytics")
	{
		adminAnalytics.GET("/overview", getOverview)
		adminAnalytics.GET("/users", getUserGrowth)
		adminAnalytics.GET("/jobs", getJobMarket)
		adminAnalytics.GET("/applications", getAppFunnel)
		adminAnalytics.GET("/recruiters", getOverview)
		adminAnalytics.GET("/companies", getOverview)
		adminAnalytics.GET("/communities", getCommunities)
		adminAnalytics.GET("/messaging", getMessaging)
		adminAnalytics.GET("/notifications", getNotifications)
		adminAnalytics.GET("/recommendations", getRecommendations)
		adminAnalytics.GET("/ai", getOverview)
		adminAnalytics.GET("/search", getSearch)
		adminAnalytics.GET("/search/zero-results", getSearch)
		adminAnalytics.GET("/support", getOverview)
		adminAnalytics.GET("/safety", getTrustSafety)
		adminAnalytics.GET("/system", getOverview)
		adminAnalytics.GET("/system/performance", getPerformance)
		adminAnalytics.GET("/performance", getPerformance)
		adminAnalytics.GET("/trust-safety", getTrustSafety)
		adminAnalytics.GET("/mentorship", getMentorship)
		adminAnalytics.GET("/learning", getLearning)
		adminAnalytics.GET("/funnel", getFunnel)
		adminAnalytics.GET("/cohorts", getCohorts)
		adminAnalytics.GET("/feature-adoption", getFeatureAdoption)
		adminAnalytics.GET("/events", getOverview)
		adminAnalytics.POST("/export", requestExport)
		adminAnalytics.POST("/reports/custom", generateCustomReport)
		adminAnalytics.GET("/reports/scheduled", getScheduled)
		adminAnalytics.POST("/reports/scheduled", createScheduled)
		adminAnalytics.GET("/reports/download/:id", downloadReport)
		adminAnalytics.POST("/cleanup", triggerCleanup)
	}
}
