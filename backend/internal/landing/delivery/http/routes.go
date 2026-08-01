package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *LandingHandler) {
	landingGroup := api.Group("/landing")
	{
		landingGroup.GET("/content", handler.GetLandingContent)
		landingGroup.POST("/admin/testimonials", sharedMiddleware.AuthRequired(), handler.CreateTestimonial)
		landingGroup.POST("/admin/featured-jobs", sharedMiddleware.AuthRequired(), handler.CreateFeaturedJob)
	}
}
