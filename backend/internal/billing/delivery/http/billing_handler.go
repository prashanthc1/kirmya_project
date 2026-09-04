package http

import (
	"errors"
	"io"
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
				"plan":    "free",
				"status":  "active",
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
			"status":  "billing_disabled",
			"error":   "BILLING_DISABLED",
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
// maxWebhookBody caps how much an unauthenticated caller can make the process
// read. The endpoint is reachable by anyone, so it is bounded before parsing.
const maxWebhookBody = 1 << 20 // 1 MiB

// webhookSignature pulls the provider's signature off the request. Providers
// disagree on the header name, so the ones in use are checked in turn before a
// generic fallback.
func webhookSignature(c *gin.Context) string {
	for _, header := range []string{
		"Stripe-Signature",
		"Paddle-Signature",
		"X-Razorpay-Signature",
		"X-Webhook-Signature",
	} {
		if v := c.GetHeader(header); v != "" {
			return v
		}
	}
	return ""
}

// ProcessWebhook accepts a payment-provider callback.
//
// The route is deliberately unauthenticated: a provider cannot present a user
// token. Its signature is therefore the only evidence the event is genuine, so
// the raw body and the signature header are both passed to the service, which
// refuses anything it cannot verify. This previously sent a nil payload and an
// empty signature, which meant nothing was ever verified.
func (h *BillingHandler) ProcessWebhook(c *gin.Context) {
	provider := c.Param("provider")

	// The signature covers the bytes exactly as sent, so the raw body is read
	// rather than a re-encoding of a parsed struct.
	payload, err := io.ReadAll(io.LimitReader(c.Request.Body, maxWebhookBody))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not read webhook body"})
		return
	}

	if err := h.billingService.ProcessWebhook(c.Request.Context(), provider, payload, webhookSignature(c)); err != nil {
		if errors.Is(err, service.ErrWebhookSignatureInvalid) {
			// Unverified, not malformed: this caller has not proven they are
			// the provider. The response says nothing about why.
			c.JSON(http.StatusUnauthorized, gin.H{"error": "webhook signature verification failed"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}
