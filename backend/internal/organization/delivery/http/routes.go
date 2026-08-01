package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *OrganizationHandler) {
	orgGroup := api.Group("/organizations")
	orgGroup.Use(sharedMiddleware.AuthRequired())
	{
		orgGroup.POST("", handler.CreateOrganization)
		orgGroup.GET("", handler.GetOrganizationsForUser)
		orgGroup.GET("/permissions", handler.GetAllPermissions)
		orgGroup.POST("/:id/members", handler.AddMember)
		orgGroup.GET("/:id/members", handler.GetOrgMembers)
	}
}
