package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *ReferralHandler) {
	referralsGroup := api.Group("/referrals")
	referralsGroup.Use(sharedMiddleware.AuthRequired())
	{
		referralsGroup.POST("/requests", handler.CreateRequest)
		referralsGroup.GET("/requests", handler.GetOpenRequests)
		referralsGroup.POST("/offer", handler.OfferReferral)
		referralsGroup.GET("/my-referrals", handler.GetUserReferrals)
		referralsGroup.PUT("/:id/status", handler.UpdateReferralStatus)
	}
}
