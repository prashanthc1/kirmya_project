package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *LandingHandler) {
	landingGroup := api.Group("/landing")
	{
		landingGroup.GET("/content", handler.GetLandingContent)
		landingGroup.POST("/admin/testimonials", sharedMiddleware.AuthRequired(), sharedMiddleware.RequireAdmin(), handler.CreateTestimonial)
		landingGroup.POST("/admin/featured-jobs", sharedMiddleware.AuthRequired(), sharedMiddleware.RequireAdmin(), handler.CreateFeaturedJob)
	}
}
