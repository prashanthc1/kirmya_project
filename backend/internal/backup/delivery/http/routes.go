package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterAdminBackupRoutes(api *gin.RouterGroup, handler *BackupHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware, guard *authz.Guard) {
	if handler == nil {
		return
	}
	backups := api.Group("/admin/backups")
	backups.Use(sharedMiddleware.RequireAdmin())
	{
		backups.GET("", guard.Require(adminDomain.PermBackupsRead), handler.ListBackups)
		backups.POST("", guard.Require(adminDomain.PermBackupsManage), handler.TriggerBackup)
		backups.GET("/health", guard.Require(adminDomain.PermBackupsRead), handler.GetHealthSummary)
		backups.GET("/tiers", guard.Require(adminDomain.PermBackupsRead), handler.GetDataTierClassifications)
		backups.GET("/configuration", guard.Require(adminDomain.PermBackupsRead), handler.GetConfiguration)
		backups.PUT("/configuration", guard.Require(adminDomain.PermBackupsManage), handler.UpdateConfiguration)
		backups.GET("/restore-tests", guard.Require(adminDomain.PermBackupsRead), handler.ListRestoreTests)
		backups.POST("/restore-tests", guard.Require(adminDomain.PermBackupsManage), handler.RunRestoreTest)
		backups.POST("/restore-confirm", guard.Require(adminDomain.PermBackupsManage), handler.ConfirmProductionRestore)
		backups.GET("/incidents", guard.Require(adminDomain.PermBackupsRead), handler.ListIncidents)
		backups.POST("/incidents", guard.Require(adminDomain.PermBackupsManage), handler.CreateIncident)
		backups.GET("/:id", guard.Require(adminDomain.PermBackupsRead), handler.GetBackupByID)
		backups.POST("/:id/verify", guard.Require(adminDomain.PermBackupsManage), handler.VerifyBackup)
	}
}
