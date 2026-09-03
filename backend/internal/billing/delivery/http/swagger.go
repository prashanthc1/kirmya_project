package http

import (
	"kirmya/internal/billing/models"
	"kirmya/internal/common/swagger"
)

// swaggerBillingPlans documents GET /api/v1/billing/plans
//
// @Summary      List billing plans
// @Description  Returns active pricing plans available on the platform
// @Tags         Billing
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/billing/plans [get]
func swaggerBillingPlans() {}

// swaggerBillingStatus documents GET /api/v1/billing/status
//
// @Summary      Get billing status
// @Description  Returns the current billing enablement status
// @Tags         Billing
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/billing/status [get]
func swaggerBillingStatus() {}

// swaggerBillingSubscription documents GET /api/v1/billing/subscription
//
// @Summary      Get subscription details
// @Description  Returns the user's current subscription plan and status
// @Tags         Billing
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/billing/subscription [get]
func swaggerBillingSubscription() {}

// swaggerBillingCheckout documents POST /api/v1/billing/checkout
//
// @Summary      Initiate checkout session
// @Description  Creates a checkout session for subscribing to a plan
// @Tags         Billing
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CheckoutRequest  true  "Checkout payload"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/billing/checkout [post]
func swaggerBillingCheckout() {}

// swaggerBillingWebhook documents POST /api/v1/billing/webhooks/{provider}
//
// @Summary      Process payment provider webhook
// @Description  Handles payment gateway callbacks (Stripe, LemonSqueezy)
// @Tags         Billing
// @Accept       json
// @Produce      json
// @Param        provider  path      string  true  "Provider name (e.g. stripe)"
// @Param        payload   body      object  true  "Webhook payload"
// @Success      200       {object}  swagger.SuccessResponse
// @Failure      400       {object}  swagger.ErrorResponse
// @Router       /api/v1/billing/webhooks/{provider} [post]
func swaggerBillingWebhook() {}

// swaggerAdminBillingStatus documents GET /api/v1/admin/billing/status
//
// @Summary      Get admin billing configuration
// @Description  Returns comprehensive billing system status for administrators
// @Tags         Admin Billing
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/billing/status [get]
func swaggerAdminBillingStatus() {}

// swaggerAdminBillingPlans documents GET /api/v1/admin/billing/plans
//
// @Summary      Get all billing plans (Admin)
// @Description  Returns administrative overview of all billing plans and quotas
// @Tags         Admin Billing
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/billing/plans [get]
func swaggerAdminBillingPlans() {}

// swaggerAdminBillingEntitlements documents GET /api/v1/admin/billing/entitlements
//
// @Summary      Get feature entitlements (Admin)
// @Description  Returns mapping of tiers to feature entitlements
// @Tags         Admin Billing
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/billing/entitlements [get]
func swaggerAdminBillingEntitlements() {}

// swaggerAdminBillingAnalytics documents GET /api/v1/admin/billing/analytics
//
// @Summary      Get billing analytics (Admin)
// @Description  Returns revenue, MRR, churn, and conversion analytics
// @Tags         Admin Billing
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/billing/analytics [get]
func swaggerAdminBillingAnalytics() {}

var (
	_ models.Plan
	_ swagger.ErrorResponse
)

