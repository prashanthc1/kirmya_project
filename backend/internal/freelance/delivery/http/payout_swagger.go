package http

import (
	// Referenced only from the annotations below; imported for swaggo.
	_ "kirmya/internal/common/swagger"
	_ "kirmya/internal/freelance/domain"
)

// The OpenAPI contract for the payout surface. As in swagger.go, these functions
// have no runtime role: swaggo reads their annotations. Regenerate the spec with
// `make swagger` after changing anything here.

// swaggerListMyFreelancePayouts documents GET /api/v1/freelance/payouts.
//
// @Summary      List my payouts
// @Description  The caller's payouts, newest first: one per milestone released to them, with its status - pending (waiting for a ready payout account, or for the next attempt after a failed send), processing, paid (transferred to the caller's payout account, from where the payment processor pays it to their bank on its own schedule), or failed (sending stopped; the platform's administrators retry it). Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/payouts [get]
func swaggerListMyFreelancePayouts() {}

// swaggerGetFreelancePayoutAccount documents GET /api/v1/freelance/payouts/account.
//
// @Summary      Get my payout account
// @Description  Where the caller's payout account stands, as last stored (the payment processor is not asked; POST .../refresh does that): not_started, onboarding (the processor's form is not finished), action_required (the processor needs more information), in_review, or enabled (payouts are sent). waiting is what has been released to the caller and not yet paid, per currency. available is false when this deployment cannot send payouts. Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Success      200  {object}  domain.PayoutAccountView
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/payouts/account [get]
func swaggerGetFreelancePayoutAccount() {}

// swaggerStartFreelancePayoutOnboarding documents POST /api/v1/freelance/payouts/account/onboarding.
//
// @Summary      Set up payouts
// @Description  Creates the caller's payout account at the payment processor if they have none, and returns url: a single-use link to the processor's hosted onboarding, where the freelancer gives their identity and bank details to the processor directly - Kirmya never receives them. With Stripe the account is an Express connected account, and onboarding returns to /freelance/payouts?onboarding=return (or ?onboarding=refresh when the link expired). No url when there is nothing to fill in. Only for freelancers: without a freelancer profile, 403. 503 (FREELANCE_PAYMENTS_UNAVAILABLE) when this deployment cannot send payouts; 502 (FREELANCE_PAYMENT_PROVIDER_ERROR) when the processor refused. Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Success      200  {object}  domain.PayoutOnboarding
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      502  {object}  swagger.ErrorResponse
// @Failure      503  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/payouts/account/onboarding [post]
func swaggerStartFreelancePayoutOnboarding() {}

// swaggerRefreshFreelancePayoutAccount documents POST /api/v1/freelance/payouts/account/refresh.
//
// @Summary      Refresh my payout account
// @Description  Asks the payment processor for the caller's payout account state and stores it; called when the freelancer returns from onboarding, so their payouts start without waiting for the processor's webhook. When the account becomes enabled, payouts waiting for it are sent. Answers the same body as GET .../account. 502 (FREELANCE_PAYMENT_PROVIDER_ERROR) when the processor could not be asked. Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Success      200  {object}  domain.PayoutAccountView
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      502  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/payouts/account/refresh [post]
func swaggerRefreshFreelancePayoutAccount() {}

// swaggerAdminListFreelancePayouts documents GET /api/v1/admin/freelance/payouts.
//
// @Summary      List freelance payouts
// @Description  The administrative payout queue, oldest first, with each payout's attempts, last error and destination account, the payee (id, name, email) and the project it pays for. Requires an administrator session AND the freelance.admin.read permission. status narrows it: failed (the default - payouts whose sending stopped after repeated failures), all, or a single payout status.
// @Tags         Admin
// @Produce      json
// @Param        status  query  string  false  "failed (default), all, or one payout status"
// @Param        page    query  int     false  "Page number (1-based)"  default(1)
// @Param        limit   query  int     false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/freelance/payouts [get]
func swaggerAdminListFreelancePayouts() {}

// swaggerAdminRetryFreelancePayout documents POST /api/v1/admin/freelance/payouts/{id}/retry.
//
// @Summary      Retry a failed payout
// @Description  Puts a failed payout back in the queue with a fresh set of attempts, once whatever made it fail has been fixed. Requires an administrator session AND the freelance.admin.write permission, because this sends money. Sending is idempotent per payout at the processor, so a retry can never pay twice. Only a failed payout can be retried (409 otherwise). Recorded in the audit log.
// @Tags         Admin
// @Produce      json
// @Param        id  path  string  true  "Payout ID"
// @Success      200  {object}  domain.Payout
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/freelance/payouts/{id}/retry [post]
func swaggerAdminRetryFreelancePayout() {}
