package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *EnterpriseHandler) {
	enterpriseGroup := api.Group("/enterprise")
	enterpriseGroup.Use(sharedMiddleware.AuthRequired())
	{
		enterpriseGroup.GET("/overview", handler.GetOverview)
		enterpriseGroup.GET("/teams", handler.GetTeams)
		enterpriseGroup.POST("/teams", handler.CreateTeam)
		enterpriseGroup.GET("/pools", handler.GetCandidatePools)
		enterpriseGroup.POST("/pools", handler.CreateCandidatePool)
		enterpriseGroup.GET("/audit-logs", handler.GetAuditLogs)
	}
}
