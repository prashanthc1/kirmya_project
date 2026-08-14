package http

import (
	"github.com/gin-gonic/gin"
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

func RegisterAdminRoutes(api *gin.RouterGroup, handler *DataOperationsHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware) {
	adminOps := api.Group("/admin/data-operations")
	adminOps.Use(sharedMiddleware.AuthRequired())
	{
		adminOps.POST("/imports/preview", handler.PreviewImport)
		adminOps.POST("/imports", handler.CreateImport)
		adminOps.GET("/imports", handler.ListAdminImports)
		adminOps.GET("/imports/:id", handler.GetImportByID)

		adminOps.POST("/exports", handler.CreateAdminExport)
		adminOps.GET("/exports", handler.ListAdminExports)

		adminOps.POST("/bulk-operations", handler.ExecuteBulkOperation)
		adminOps.GET("/bulk-operations", handler.ListBulkOperations)

		adminOps.GET("/migrations", handler.ListDataMigrations)
	}
}
