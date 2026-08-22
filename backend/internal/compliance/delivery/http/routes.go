package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *ComplianceHandler) {
	if handler == nil {
		return
	}

	// User Compliance & Privacy Routes
	complianceGroup := api.Group("/compliance")
	complianceGroup.Use(sharedMiddleware.AuthRequired())
	{
		complianceGroup.POST("/consent", handler.UpdateConsent)
		complianceGroup.GET("/consent", handler.GetUserConsents)
		complianceGroup.POST("/export", handler.RequestDataExport)
		complianceGroup.GET("/export/download", handler.DownloadDataExport)
		complianceGroup.POST("/delete-account", handler.RequestAccountDeletion)
		complianceGroup.GET("/requests", handler.GetUserDataRequests)
		complianceGroup.POST("/requests", handler.CreateUserRequest)
	}

	// Admin Governance & Compliance Routes
	adminHandler := handler.AdminHandler
	if adminHandler == nil {
		adminHandler = NewAdminComplianceHandler(handler.svc)
	}

	adminComplianceGroup := api.Group("/admin/compliance")
	adminComplianceGroup.Use(sharedMiddleware.AuthRequired())
	{
		adminComplianceGroup.GET("/dsr", adminHandler.GetAllDataRequests)
		adminComplianceGroup.PATCH("/dsr/:id", adminHandler.UpdateDataRequest)
		adminComplianceGroup.GET("/legal-holds", adminHandler.GetLegalHolds)
		adminComplianceGroup.POST("/legal-holds", adminHandler.CreateLegalHold)
		adminComplianceGroup.PATCH("/legal-holds/:id/release", adminHandler.ReleaseLegalHold)
		adminComplianceGroup.GET("/access-reviews", adminHandler.GetAccessReviews)
		adminComplianceGroup.POST("/access-reviews", adminHandler.CreateAccessReview)
		adminComplianceGroup.GET("/risk-summary", adminHandler.GetPrivacyRiskSummary)
		adminComplianceGroup.GET("/overview", adminHandler.GetComplianceOverview)
		adminComplianceGroup.GET("/incidents", adminHandler.GetPrivacyIncidents)
		adminComplianceGroup.POST("/incidents", adminHandler.CreatePrivacyIncident)
		adminComplianceGroup.GET("/policy-versions", adminHandler.GetPolicyVersions)
		adminComplianceGroup.POST("/policy-versions", adminHandler.CreatePolicyVersion)
	}

	adminGovernanceGroup := api.Group("/admin/data-governance")
	adminGovernanceGroup.Use(sharedMiddleware.AuthRequired())
	{
		adminGovernanceGroup.GET("/inventory", adminHandler.GetDataInventory)
		adminGovernanceGroup.POST("/inventory", adminHandler.AddInventoryItem)
		adminGovernanceGroup.GET("/retention", adminHandler.GetRetentionPolicies)
		adminGovernanceGroup.PUT("/retention", adminHandler.UpdateRetentionPolicy)
		adminGovernanceGroup.POST("/retention/run", adminHandler.RunRetention)
		adminGovernanceGroup.GET("/processors", adminHandler.GetThirdPartyProcessors)
		adminGovernanceGroup.POST("/processors", adminHandler.AddThirdPartyProcessor)
		adminGovernanceGroup.GET("/quality-checks", adminHandler.GetDataQualityChecks)
		adminGovernanceGroup.POST("/quality-checks/run", adminHandler.RunQualityCheck)
	}
}
