package http

import (
	"github.com/gin-gonic/gin"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterBillingRoutes(router *gin.RouterGroup, handler *BillingHandler, auth ...*authMiddlewarePkg.AuthMiddleware) {
	if handler == nil {
		return
	}
	billing := router.Group("/billing")

	// Public / Webhook routes
	billing.POST("/webhooks/:provider", handler.ProcessWebhook)
	billing.GET("/plans", handler.GetPlans)

	// Authenticated billing routes
	authed := billing.Group("")
	if len(auth) > 0 && auth[0] != nil {
		authed.Use(auth[0].RequireAuth())
	} else {
		authed.Use(sharedMiddleware.AuthRequired())
	}
	{
		authed.GET("/status", handler.GetStatus)
		authed.GET("/subscription", handler.GetSubscription)
		authed.POST("/checkout", handler.CreateCheckout)
	}
}

func RegisterAdminBillingRoutes(router *gin.RouterGroup, handler *AdminBillingHandler, auth ...*authMiddlewarePkg.AuthMiddleware) {
	if handler == nil {
		return
	}
	adminBilling := router.Group("/admin/billing")
	adminBilling.Use(sharedMiddleware.RequireAdmin())
	{
		adminBilling.GET("/status", handler.GetAdminStatus)
		adminBilling.GET("/plans", handler.GetAdminPlans)
		adminBilling.GET("/entitlements", handler.GetAdminEntitlements)
		adminBilling.GET("/analytics", handler.GetAdminAnalytics)
	}
}
