package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *FreelanceHandler) {
	freelanceGroup := api.Group("/freelance")
	{
		freelanceGroup.GET("/projects", handler.GetProjects)
		freelanceGroup.GET("/projects/:id", handler.GetProjectByID)

		protected := freelanceGroup.Group("")
		protected.Use(sharedMiddleware.AuthRequired())
		{
			protected.POST("/projects", handler.CreateProject)
			protected.POST("/projects/:id/proposals", handler.SubmitProposal)
			protected.POST("/proposals/:id/accept", handler.AcceptProposal)
			protected.GET("/contracts", handler.GetUserContracts)
			protected.GET("/profile", handler.GetProfile)
			protected.POST("/profile", handler.SaveProfile)
		}
	}
}
