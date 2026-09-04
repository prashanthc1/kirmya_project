package http

import (
	"github.com/gin-gonic/gin"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterAdminBackupRoutes(api *gin.RouterGroup, handler *BackupHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware) {
	if handler == nil {
		return
	}
	backups := api.Group("/admin/backups")
	backups.Use(sharedMiddleware.RequireAdmin())
	{
		backups.GET("", handler.ListBackups)
		backups.POST("", handler.TriggerBackup)
		backups.GET("/health", handler.GetHealthSummary)
		backups.GET("/tiers", handler.GetDataTierClassifications)
		backups.GET("/configuration", handler.GetConfiguration)
		backups.PUT("/configuration", handler.UpdateConfiguration)
		backups.GET("/restore-tests", handler.ListRestoreTests)
		backups.POST("/restore-tests", handler.RunRestoreTest)
		backups.POST("/restore-confirm", handler.ConfirmProductionRestore)
		backups.GET("/incidents", handler.ListIncidents)
		backups.POST("/incidents", handler.CreateIncident)
		backups.GET("/:id", handler.GetBackupByID)
		backups.POST("/:id/verify", handler.VerifyBackup)
	}
}
