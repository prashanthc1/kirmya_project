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
		communities.GET("/recommendations", handler.GetRecommendedCommunities)
		communities.POST("/reports", handler.ReportPost)
		communities.POST("/invites/:inviteId/respond", handler.RespondToInvite)

		communities.GET("/:id", handler.GetCommunity)
		communities.PUT("/:id", handler.UpdateCommunity)
		communities.POST("/:id/join", handler.JoinCommunity)
		communities.POST("/:id/leave", handler.LeaveCommunity)

		communities.GET("/:id/members", handler.ListMembers)
		communities.PUT("/:id/memberships", handler.ApproveMembership)
		communities.PUT("/:id/roles", handler.AssignRole)
		communities.GET("/:id/requests", handler.ListPendingRequests)
		communities.POST("/:id/invites", handler.InviteUser)

		communities.POST("/:id/posts", handler.CreatePost)
		communities.GET("/:id/posts", handler.ListPosts)
		communities.GET("/:id/posts/:postId", handler.GetPost)
		communities.DELETE("/:id/posts/:postId", handler.DeletePost)
		communities.PUT("/:id/posts/:postId/pin", handler.PinPost)
		communities.PUT("/:id/posts/:postId/lock", handler.LockPost)

		communities.POST("/:id/posts/:postId/comments", handler.CreateComment)
		communities.GET("/:id/posts/:postId/comments", handler.ListComments)

		communities.POST("/:id/events", handler.CreateEvent)
		communities.GET("/:id/events", handler.ListEvents)

		communities.POST("/:id/resources", handler.CreateResource)
		communities.GET("/:id/resources", handler.ListResources)

		communities.POST("/:id/moderation/moderate", handler.ModerateMember)
		communities.GET("/:id/moderation/actions", handler.ListModerationActions)
		communities.GET("/:id/reports", handler.ListReports)
	}
}
