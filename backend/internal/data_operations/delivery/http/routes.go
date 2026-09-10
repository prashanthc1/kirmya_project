package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterUserRoutes(api *gin.RouterGroup, handler *DataOperationsHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware) {
	userOps := api.Group("/settings/data-export")
	userOps.Use(sharedMiddleware.AuthRequired())
	{
		userOps.POST("", handler.RequestUserExport)
		userOps.GET("/history", handler.ListUserExports)
	}
}

func RegisterAdminRoutes(api *gin.RouterGroup, handler *DataOperationsHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware, guard *authz.Guard) {
	if handler == nil {
		return
	}
	adminOps := api.Group("/admin/data-operations")
	adminOps.Use(sharedMiddleware.RequireAdmin())
	{
		adminOps.POST("/imports/preview", guard.Require(adminDomain.PermDataOpsManage), handler.PreviewImport)
		adminOps.POST("/imports", guard.Require(adminDomain.PermDataOpsManage), handler.CreateImport)
		adminOps.GET("/imports", guard.Require(adminDomain.PermDataOpsRead), handler.ListAdminImports)
		adminOps.GET("/imports/:id", guard.Require(adminDomain.PermDataOpsRead), handler.GetImportByID)

		adminOps.POST("/exports", guard.Require(adminDomain.PermDataOpsManage), handler.CreateAdminExport)
		adminOps.GET("/exports", guard.Require(adminDomain.PermDataOpsRead), handler.ListAdminExports)

		adminOps.POST("/bulk-operations", guard.Require(adminDomain.PermDataOpsManage), handler.ExecuteBulkOperation)
		adminOps.GET("/bulk-operations", guard.Require(adminDomain.PermDataOpsRead), handler.ListBulkOperations)

		adminOps.GET("/migrations", guard.Require(adminDomain.PermDataOpsRead), handler.ListDataMigrations)
	}
}
