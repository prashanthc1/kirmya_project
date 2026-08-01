package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *CommunityHandler) {
	communities := api.Group("/communities")
	communities.Use(sharedMiddleware.AuthRequired())
	{
		communities.GET("", handler.ListCommunities)
		communities.POST("", handler.CreateCommunity)
		communities.POST("/:id/join", handler.JoinCommunity)
		communities.PUT("/:id/memberships", handler.ApproveMembership)
		communities.PUT("/:id/roles", handler.AssignRole)
		communities.POST("/:id/posts", handler.CreatePost)
		communities.GET("/:id/posts", handler.ListPosts)
		communities.DELETE("/:id/posts/:postId", handler.DeletePost)
		communities.POST("/reports", handler.ReportPost)
	}
}
