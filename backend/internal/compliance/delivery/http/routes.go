package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *ComplianceHandler, guard *authz.Guard) {
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
	adminComplianceGroup.Use(sharedMiddleware.AuthRequired(), sharedMiddleware.RequireAdmin())
	{
		adminComplianceGroup.GET("/dsr", guard.Require(adminDomain.PermComplianceRead), adminHandler.GetAllDataRequests)
		adminComplianceGroup.PATCH("/dsr/:id", guard.Require(adminDomain.PermComplianceManage), adminHandler.UpdateDataRequest)
		adminComplianceGroup.GET("/legal-holds", guard.Require(adminDomain.PermComplianceRead), adminHandler.GetLegalHolds)
		adminComplianceGroup.POST("/legal-holds", guard.Require(adminDomain.PermComplianceManage), adminHandler.CreateLegalHold)
		adminComplianceGroup.PATCH("/legal-holds/:id/release", guard.Require(adminDomain.PermComplianceManage), adminHandler.ReleaseLegalHold)
		adminComplianceGroup.GET("/access-reviews", guard.Require(adminDomain.PermComplianceRead), adminHandler.GetAccessReviews)
		adminComplianceGroup.POST("/access-reviews", guard.Require(adminDomain.PermComplianceManage), adminHandler.CreateAccessReview)
		adminComplianceGroup.GET("/risk-summary", guard.Require(adminDomain.PermComplianceRead), adminHandler.GetPrivacyRiskSummary)
		adminComplianceGroup.GET("/overview", guard.Require(adminDomain.PermComplianceRead), adminHandler.GetComplianceOverview)
		adminComplianceGroup.GET("/incidents", guard.Require(adminDomain.PermComplianceRead), adminHandler.GetPrivacyIncidents)
		adminComplianceGroup.POST("/incidents", guard.Require(adminDomain.PermComplianceManage), adminHandler.CreatePrivacyIncident)
		adminComplianceGroup.GET("/policy-versions", guard.Require(adminDomain.PermComplianceRead), adminHandler.GetPolicyVersions)
		adminComplianceGroup.POST("/policy-versions", guard.Require(adminDomain.PermComplianceManage), adminHandler.CreatePolicyVersion)
	}

	adminGovernanceGroup := api.Group("/admin/data-governance")
	adminGovernanceGroup.Use(sharedMiddleware.AuthRequired(), sharedMiddleware.RequireAdmin())
	{
		adminGovernanceGroup.GET("/inventory", guard.Require(adminDomain.PermComplianceRead), adminHandler.GetDataInventory)
		adminGovernanceGroup.POST("/inventory", guard.Require(adminDomain.PermComplianceManage), adminHandler.AddInventoryItem)
		adminGovernanceGroup.GET("/retention", guard.Require(adminDomain.PermComplianceRead), adminHandler.GetRetentionPolicies)
		adminGovernanceGroup.PUT("/retention", guard.Require(adminDomain.PermComplianceManage), adminHandler.UpdateRetentionPolicy)
		adminGovernanceGroup.POST("/retention/run", guard.Require(adminDomain.PermDataOpsManage), adminHandler.RunRetention)
		adminGovernanceGroup.GET("/processors", guard.Require(adminDomain.PermComplianceRead), adminHandler.GetThirdPartyProcessors)
		adminGovernanceGroup.POST("/processors", guard.Require(adminDomain.PermComplianceManage), adminHandler.AddThirdPartyProcessor)
		adminGovernanceGroup.GET("/quality-checks", guard.Require(adminDomain.PermComplianceRead), adminHandler.GetDataQualityChecks)
		adminGovernanceGroup.POST("/quality-checks/run", guard.Require(adminDomain.PermDataOpsManage), adminHandler.RunQualityCheck)
	}
}
