package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterLegalRoutes(router *gin.RouterGroup, handler *LegalHandler) {
	legal := router.Group("/legal")
	{
		legal.GET("/documents/:slug", handler.GetDocument)
		legal.GET("/documents/:slug/versions", handler.GetDocumentVersions)
	}

	cookies := router.Group("/cookies")
	{
		cookies.GET("", handler.GetCookies)
		cookies.POST("/consent", handler.SaveCookieConsent)
	}

	privacy := router.Group("/privacy")
	privacy.Use(sharedMiddleware.AuthRequired())
	{
		privacy.GET("", handler.GetPrivacyPreferences)
		privacy.PUT("", handler.UpdatePrivacyPreferences)
		privacy.GET("/cookies", handler.GetCookies)
		privacy.PUT("/cookies", handler.SaveCookieConsent)
		privacy.GET("/consents", handler.GetConsentHistory)
		privacy.POST("/consents", handler.SaveCookieConsent)
		privacy.GET("/export", handler.GetDataExportJob)
		privacy.POST("/export", handler.RequestDataExport)
		privacy.GET("/export/:id", handler.GetDataExportJob)
		privacy.GET("/requests", handler.GetUserPrivacyRequests)
		privacy.POST("/requests", handler.CreatePrivacyRequest)
		privacy.GET("/requests/:id", handler.GetPrivacyRequestByID)
		privacy.POST("/delete-account", handler.RequestAccountDeletion)
		privacy.POST("/delete-account/cancel", handler.CancelAccountDeletion)
		privacy.GET("/retention", handler.GetRetentionPolicies)
	}
}

func RegisterAdminLegalRoutes(router *gin.RouterGroup, handler *AdminLegalHandler) {
	adminLegal := router.Group("/admin/legal")
	adminLegal.Use(sharedMiddleware.AuthRequired())
	{
		adminLegal.GET("/documents", handler.GetAdminDocuments)
		adminLegal.GET("/privacy-requests", handler.GetPrivacyRequests)
		adminLegal.GET("/retention", handler.GetRetentionPolicies)
		adminLegal.GET("/legal-holds", handler.GetLegalHolds)
	}

	adminPrivacy := router.Group("/admin/privacy")
	adminPrivacy.Use(sharedMiddleware.AuthRequired())
	{
		adminPrivacy.GET("", handler.GetAdminPrivacySummary)
		adminPrivacy.GET("/requests", handler.GetPrivacyRequests)
		adminPrivacy.GET("/requests/:id", handler.GetPrivacyRequestByID)
		adminPrivacy.PUT("/requests/:id", handler.UpdatePrivacyRequest)
		adminPrivacy.GET("/consents", handler.GetAdminConsents)
		adminPrivacy.GET("/retention", handler.GetRetentionPolicies)
		adminPrivacy.PUT("/retention", handler.UpdateRetentionPolicy)
		adminPrivacy.GET("/data-processing", handler.GetDataProcessingRecords)
		adminPrivacy.POST("/export", handler.CreateAdminDataExport)
	}
}
