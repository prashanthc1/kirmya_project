package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"kirmya/internal/billing/service"
)

type AdminBillingHandler struct {
	billingService service.BillingService
}

func NewAdminBillingHandler(billingService service.BillingService) *AdminBillingHandler {
	return &AdminBillingHandler{billingService: billingService}
}

func (h *AdminBillingHandler) GetAdminStatus(c *gin.Context) {
	status := h.billingService.GetBillingStatus(c.Request.Context())
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"billing_enabled": status.BillingEnabled,
			"active_plans_count": 1,
			"active_customers_count": 0,
			"mrr_cents": 0,
			"message": "Billing is currently disabled. Platform operating under 100% free mode.",
		},
	})
}

func (h *AdminBillingHandler) GetAdminPlans(c *gin.Context) {
	plans, err := h.billingService.GetPlans(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": plans})
}

func (h *AdminBillingHandler) GetAdminEntitlements(c *gin.Context) {
	entitlements, err := h.billingService.GetEntitlements(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": entitlements})
}

func (h *AdminBillingHandler) GetAdminAnalytics(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"mrr": 0,
			"arr": 0,
			"active_subscriptions": 0,
			"churn_rate": 0,
			"message": "Billing is currently disabled.",
		},
	})
}
