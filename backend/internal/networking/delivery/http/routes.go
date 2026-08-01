package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *NetworkingHandler) {
	networking := api.Group("/networking")
	networking.Use(sharedMiddleware.AuthRequired())
	{
		networking.GET("/recommendations", handler.GetRecommendations)
		networking.GET("/connections", handler.ListConnections)
		networking.GET("/requests", handler.ListIncomingRequests)
		networking.POST("/requests", handler.SendRequest)
		networking.PUT("/requests/:id", handler.UpdateRequest)
		networking.POST("/blocks", handler.BlockUser)
		networking.DELETE("/blocks/:userId", handler.UnblockUser)
	}
}
