package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *NetworkingHandler) {
	// People Search & Discovery Group
	people := api.Group("/people")
	people.Use(sharedMiddleware.AuthRequired())
	{
		people.GET("", handler.SearchPeople)
		people.GET("/search", handler.SearchPeople)
		people.GET("/suggestions", handler.GetRecommendations)
	}

	// Network Management Group
	network := api.Group("/network")
	network.Use(sharedMiddleware.AuthRequired())
	{
		network.GET("", handler.GetNetworkStats)
		network.GET("/connections", handler.ListConnections)
		network.DELETE("/connections/:id", handler.RemoveConnection)
		network.GET("/requests", handler.ListIncomingRequests)
		network.GET("/requests/sent", handler.ListSentRequests)
		network.POST("/requests", handler.SendRequest)
		network.POST("/requests/:id/accept", handler.AcceptRequest)
		network.POST("/requests/:id/decline", handler.RejectRequest)
		network.POST("/requests/:id/withdraw", handler.WithdrawRequest)
		network.GET("/mutual/:userId", handler.GetMutualConnections)
		network.POST("/recommendations/:userId/dismiss", handler.DismissRecommendation)
		network.POST("/follow/:userId", handler.FollowUser)
		network.DELETE("/follow/:userId", handler.UnfollowUser)
		network.POST("/report/:userId", handler.ReportUser)
	}

	// Legacy /networking Group (Backwards Compatibility)
	networking := api.Group("/networking")
	networking.Use(sharedMiddleware.AuthRequired())
	{
		networking.GET("/recommendations", handler.GetRecommendations)
		networking.GET("/connections", handler.ListConnections)
		networking.GET("/requests", handler.ListIncomingRequests)
		networking.POST("/requests", handler.SendRequest)
		networking.PUT("/requests/:id", handler.UpdateRequestLegacy)
		networking.POST("/blocks", handler.BlockUser)
		networking.DELETE("/blocks/:userId", handler.UnblockUser)
	}

	// Admin Network Management Group
	adminNetwork := api.Group("/admin/network")
	adminNetwork.Use(sharedMiddleware.AuthRequired())
	{
		adminNetwork.GET("/analytics", handler.GetAdminAnalytics)
		adminNetwork.GET("/reports", handler.GetAdminReports)
	}
}
