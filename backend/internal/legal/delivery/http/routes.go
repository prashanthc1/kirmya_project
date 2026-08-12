package http

import (
	"github.com/gin-gonic/gin"
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
	{
		privacy.POST("/data-export", handler.RequestDataExport)
		privacy.POST("/delete-account", handler.RequestAccountDeletion)
	}
}

func RegisterAdminLegalRoutes(router *gin.RouterGroup, handler *AdminLegalHandler) {
	adminLegal := router.Group("/admin/legal")
	{
		adminLegal.GET("/documents", handler.GetAdminDocuments)
		adminLegal.GET("/privacy-requests", handler.GetPrivacyRequests)
		adminLegal.GET("/retention", handler.GetRetentionPolicies)
		adminLegal.GET("/legal-holds", handler.GetLegalHolds)
	}
}
