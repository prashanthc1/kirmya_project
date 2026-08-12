package http

import (
	"github.com/gin-gonic/gin"
)

func RegisterBillingRoutes(router *gin.RouterGroup, handler *BillingHandler) {
	billing := router.Group("/billing")
	{
		billing.GET("/status", handler.GetStatus)
		billing.GET("/plans", handler.GetPlans)
		billing.GET("/subscription", handler.GetSubscription)
		billing.POST("/checkout", handler.CreateCheckout)
		billing.POST("/webhooks/:provider", handler.ProcessWebhook)
	}
}

func RegisterAdminBillingRoutes(router *gin.RouterGroup, handler *AdminBillingHandler) {
	adminBilling := router.Group("/admin/billing")
	{
		adminBilling.GET("/status", handler.GetAdminStatus)
		adminBilling.GET("/plans", handler.GetAdminPlans)
		adminBilling.GET("/entitlements", handler.GetAdminEntitlements)
		adminBilling.GET("/analytics", handler.GetAdminAnalytics)
	}
}
