package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"kirmya/internal/billing/models"
	"kirmya/internal/billing/service"
)

type BillingHandler struct {
	billingService service.BillingService
}

func NewBillingHandler(billingService service.BillingService) *BillingHandler {
	return &BillingHandler{billingService: billingService}
}

// GetStatus returns the current billing configuration status.
func (h *BillingHandler) GetStatus(c *gin.Context) {
	status := h.billingService.GetBillingStatus(c.Request.Context())
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": status})
}

// GetPlans returns active pricing plans.
func (h *BillingHandler) GetPlans(c *gin.Context) {
	plans, err := h.billingService.GetPlans(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": plans})
}

// GetSubscription returns current user subscription state.
func (h *BillingHandler) GetSubscription(c *gin.Context) {
	status := h.billingService.GetBillingStatus(c.Request.Context())
	if !status.BillingEnabled {
		c.JSON(http.StatusOK, gin.H{
			"status": "billing_disabled",
			"data": gin.H{
				"plan": "free",
				"status": "active",
				"message": "Kirmya is 100% free. No active subscription required.",
			},
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": gin.H{"plan": "free", "status": "active"}})
}

// CreateCheckout handles checkout session requests.
func (h *BillingHandler) CreateCheckout(c *gin.Context) {
	status := h.billingService.GetBillingStatus(c.Request.Context())
	if !status.BillingEnabled || !status.CheckoutEnabled {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "billing_disabled",
			"error": "BILLING_DISABLED",
			"message": "Kirmya is currently 100% free. Checkout is disabled.",
		})
		return
	}

	var req models.CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	url, err := h.billingService.CreateCheckoutSession(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "checkout_url": url})
}

// ProcessWebhook handles provider webhook notifications.
func (h *BillingHandler) ProcessWebhook(c *gin.Context) {
	provider := c.Param("provider")
	err := h.billingService.ProcessWebhook(c.Request.Context(), provider, nil, "")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "received"})
}
