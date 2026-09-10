package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterLegalRoutes(router *gin.RouterGroup, handler *LegalHandler) {
	legal := router.Group("/legal")
	{
		legal.GET("/documents/:slug", handler.GetDocument)
		legal.GET("/documents/:slug/versions", handler.GetDocumentVersions)
	}
	legalAuth := router.Group("/legal")
	legalAuth.Use(sharedMiddleware.AuthRequired())
	legalAuth.POST("/documents/:slug/accept", handler.AcceptDocument)

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
		privacy.POST("/export/:id/cancel", handler.CancelDataExport)
		privacy.GET("/export/:id/download", handler.DownloadDataExport)
		privacy.GET("/requests", handler.GetUserPrivacyRequests)
		privacy.POST("/requests", handler.CreatePrivacyRequest)
		privacy.GET("/requests/:id", handler.GetPrivacyRequestByID)
		privacy.POST("/delete-account", handler.RequestAccountDeletion)
		privacy.POST("/delete-account/cancel", handler.CancelAccountDeletion)
		privacy.GET("/retention", handler.GetRetentionPolicies)
	}
}

func RegisterAdminLegalRoutes(router *gin.RouterGroup, handler *AdminLegalHandler, guard *authz.Guard, auth ...*authMiddlewarePkg.AuthMiddleware) {
	if handler == nil {
		return
	}
	adminLegal := router.Group("/admin/legal")
	adminLegal.Use(sharedMiddleware.RequireAdmin())
	{
		adminLegal.GET("/documents", guard.Require(adminDomain.PermComplianceRead), handler.GetAdminDocuments)
		adminLegal.GET("/privacy-requests", guard.Require(adminDomain.PermComplianceRead), handler.GetPrivacyRequests)
		adminLegal.GET("/retention", guard.Require(adminDomain.PermComplianceRead), handler.GetRetentionPolicies)
		adminLegal.GET("/legal-holds", guard.Require(adminDomain.PermComplianceRead), handler.GetLegalHolds)
	}

	adminPrivacy := router.Group("/admin/privacy")
	adminPrivacy.Use(sharedMiddleware.RequireAdmin())
	{
		adminPrivacy.GET("", guard.Require(adminDomain.PermComplianceRead), handler.GetAdminPrivacySummary)
		adminPrivacy.GET("/requests", guard.Require(adminDomain.PermComplianceRead), handler.GetPrivacyRequests)
		adminPrivacy.GET("/requests/:id", guard.Require(adminDomain.PermComplianceRead), handler.GetPrivacyRequestByID)
		adminPrivacy.PUT("/requests/:id", guard.Require(adminDomain.PermComplianceManage), handler.UpdatePrivacyRequest)
		adminPrivacy.GET("/consents", guard.Require(adminDomain.PermComplianceRead), handler.GetAdminConsents)
		adminPrivacy.GET("/retention", guard.Require(adminDomain.PermComplianceRead), handler.GetRetentionPolicies)
		adminPrivacy.PUT("/retention", guard.Require(adminDomain.PermComplianceManage), handler.UpdateRetentionPolicy)
		adminPrivacy.GET("/data-processing", guard.Require(adminDomain.PermComplianceRead), handler.GetDataProcessingRecords)
		adminPrivacy.POST("/export", guard.Require(adminDomain.PermComplianceManage), handler.CreateAdminDataExport)
	}
}
