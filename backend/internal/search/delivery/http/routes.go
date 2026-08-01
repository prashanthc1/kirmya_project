package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *SearchHandler) {
	unifiedSearchGroup := api.Group("/unified-search")
	unifiedSearchGroup.Use(sharedMiddleware.AuthRequired())
	{
		unifiedSearchGroup.GET("", handler.Search)
		unifiedSearchGroup.GET("/suggestions", handler.GetSuggestions)
		unifiedSearchGroup.GET("/history", handler.GetHistory)
		unifiedSearchGroup.POST("/preferences", handler.SavePreference)
	}
}
