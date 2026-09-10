package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(router *gin.RouterGroup, analyticsHandler interface{}, adminHandler *AdminAnalyticsHandler, guard *authz.Guard) {
	if h, ok := analyticsHandler.(*AnalyticsHandler); ok {
		RegisterAnalyticsRoutes(router, h)
	} else {
		RegisterAnalyticsRoutes(router, nil)
	}
	RegisterAdminAnalyticsRoutes(router, adminHandler, guard)
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

	// Every group below was previously registered with no authentication
	// middleware at all. Combined with the handlers' fallback identity, that
	// let an anonymous caller read personal analytics and write consent
	// preferences against a shared synthetic user.
	internalGroup := router.Group("/internal/analytics")
	internalGroup.Use(sharedMiddleware.AuthRequired())
	{
		internalGroup.POST("/events", ingestEvent)
	}

	analytics := router.Group("/analytics")
	analytics.Use(sharedMiddleware.AuthRequired())
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
	recruiterAnalytics.Use(sharedMiddleware.AuthRequired())
	{
		recruiterAnalytics.GET("/overview", getRecruiterAnalytics)
		recruiterAnalytics.GET("/jobs", getRecruiterAnalytics)
		recruiterAnalytics.GET("/candidates", getRecruiterAnalytics)
	}

	companyAnalytics := router.Group("/company/analytics")
	companyAnalytics.Use(sharedMiddleware.AuthRequired())
	{
		companyAnalytics.GET("/overview", getCompanyAnalytics)
		companyAnalytics.GET("/jobs", getCompanyAnalytics)
		companyAnalytics.GET("/applications", getCompanyAnalytics)
		companyAnalytics.GET("/candidates", getCompanyAnalytics)
	}

	communityAnalytics := router.Group("/communities")
	communityAnalytics.Use(sharedMiddleware.AuthRequired())
	{
		communityAnalytics.GET("/:id/analytics", getCompanyAnalytics)
	}
}

func RegisterAdminAnalyticsRoutes(router *gin.RouterGroup, handler *AdminAnalyticsHandler, guard *authz.Guard) {
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
	adminAnalytics.Use(sharedMiddleware.RequireAdmin())
	{
		adminAnalytics.GET("/overview", guard.Require(adminDomain.PermAnalyticsRead), getOverview)
		adminAnalytics.GET("/users", guard.Require(adminDomain.PermAnalyticsRead), getUserGrowth)
		adminAnalytics.GET("/jobs", guard.Require(adminDomain.PermAnalyticsRead), getJobMarket)
		adminAnalytics.GET("/applications", guard.Require(adminDomain.PermAnalyticsRead), getAppFunnel)
		adminAnalytics.GET("/recruiters", guard.Require(adminDomain.PermAnalyticsRead), getOverview)
		adminAnalytics.GET("/companies", guard.Require(adminDomain.PermAnalyticsRead), getOverview)
		adminAnalytics.GET("/communities", guard.Require(adminDomain.PermAnalyticsRead), getCommunities)
		adminAnalytics.GET("/messaging", guard.Require(adminDomain.PermAnalyticsRead), getMessaging)
		adminAnalytics.GET("/notifications", guard.Require(adminDomain.PermAnalyticsRead), getNotifications)
		adminAnalytics.GET("/recommendations", guard.Require(adminDomain.PermAnalyticsRead), getRecommendations)
		adminAnalytics.GET("/ai", guard.Require(adminDomain.PermAnalyticsRead), getOverview)
		adminAnalytics.GET("/search", guard.Require(adminDomain.PermAnalyticsRead), getSearch)
		adminAnalytics.GET("/search/zero-results", guard.Require(adminDomain.PermAnalyticsRead), getSearch)
		adminAnalytics.GET("/support", guard.Require(adminDomain.PermAnalyticsRead), getOverview)
		adminAnalytics.GET("/safety", guard.Require(adminDomain.PermAnalyticsRead), getTrustSafety)
		adminAnalytics.GET("/system", guard.Require(adminDomain.PermAnalyticsRead), getOverview)
		adminAnalytics.GET("/system/performance", guard.Require(adminDomain.PermAnalyticsRead), getPerformance)
		adminAnalytics.GET("/performance", guard.Require(adminDomain.PermAnalyticsRead), getPerformance)
		adminAnalytics.GET("/trust-safety", guard.Require(adminDomain.PermAnalyticsRead), getTrustSafety)
		adminAnalytics.GET("/mentorship", guard.Require(adminDomain.PermAnalyticsRead), getMentorship)
		adminAnalytics.GET("/learning", guard.Require(adminDomain.PermAnalyticsRead), getLearning)
		adminAnalytics.GET("/funnel", guard.Require(adminDomain.PermAnalyticsRead), getFunnel)
		adminAnalytics.GET("/cohorts", guard.Require(adminDomain.PermAnalyticsRead), getCohorts)
		adminAnalytics.GET("/feature-adoption", guard.Require(adminDomain.PermAnalyticsRead), getFeatureAdoption)
		adminAnalytics.GET("/events", guard.Require(adminDomain.PermAnalyticsRead), getOverview)
		adminAnalytics.POST("/export", guard.Require(adminDomain.PermAnalyticsManage), requestExport)
		adminAnalytics.POST("/reports/custom", guard.Require(adminDomain.PermAnalyticsManage), generateCustomReport)
		adminAnalytics.GET("/reports/scheduled", guard.Require(adminDomain.PermAnalyticsRead), getScheduled)
		adminAnalytics.POST("/reports/scheduled", guard.Require(adminDomain.PermAnalyticsManage), createScheduled)
		adminAnalytics.GET("/reports/download/:id", guard.Require(adminDomain.PermAnalyticsRead), downloadReport)
		adminAnalytics.POST("/cleanup", guard.Require(adminDomain.PermDataOpsManage), triggerCleanup)
	}
}
