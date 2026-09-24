package http

import (
	// Referenced only from the annotations below; imported for swaggo.
	_ "kirmya/internal/common/swagger"
	_ "kirmya/internal/freelance/domain"
)

// The OpenAPI contract for the escrow surface. As in swagger.go, these
// functions have no runtime role: swaggo reads their annotations. Regenerate the
// spec with `make swagger` after changing anything here.

// swaggerGetFreelanceContract documents GET /api/v1/freelance/contracts/{id}.
//
// @Summary      Get contract
// @Description  Returns one contract with its milestones and escrow totals (allocated, unallocated, in escrow, released), in the contract's currency. Available to the client and the freelancer on the contract; anyone else gets 404, so walking ids reveals nothing. Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Param        id  path  string  true  "Contract ID"
// @Success      200  {object}  domain.ContractDetail
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/contracts/{id} [get]
func swaggerGetFreelanceContract() {}

// swaggerAddContractMilestone documents POST /api/v1/freelance/contracts/{id}/milestones.
//
// @Summary      Add milestone
// @Description  The client schedules part of the contract's value as a milestone, in the contract's currency. The amount must be positive, and live milestones may not add up to more than the contract total (400 on amount). The freelancer on the contract gets 403; anyone else 404. Requires a valid Bearer access token.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id       path  string                         true  "Contract ID"
// @Param        request  body  domain.CreateMilestonePayload  true  "Milestone"
// @Success      201  {object}  domain.ContractMilestone
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse  "The contract is completed or cancelled"
// @Security     BearerAuth
// @Router       /api/v1/freelance/contracts/{id}/milestones [post]
func swaggerAddContractMilestone() {}

// swaggerCancelContractMilestone documents POST /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/cancel.
//
// @Summary      Cancel milestone
// @Description  The client cancels a milestone that has not been paid for, returning its amount to the unallocated part of the contract. A funded milestone cannot be cancelled here (refunds are not available yet), and neither can one with a payment in progress: both answer 409. Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Param        id           path  string  true  "Contract ID"
// @Param        milestoneId  path  string  true  "Milestone ID"
// @Success      200  {object}  domain.ContractMilestone
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/cancel [post]
func swaggerCancelContractMilestone() {}

// swaggerFundContractMilestone documents POST /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/fund.
//
// @Summary      Fund milestone
// @Description  The client asks to pay a pending milestone into escrow. Answers 202 with a payment intent (status requires_payment) and, when the processor uses one, a checkout_url. This does not fund the milestone: it becomes funded only when the payment processor's signed webhook confirms the money, and the contract becomes active on its first funded milestone. 409 (FREELANCE_ESCROW_CONFLICT) while another payment for the milestone is in progress; 503 (FREELANCE_PAYMENTS_UNAVAILABLE) when this deployment has no payment processor; 502 (FREELANCE_PAYMENT_PROVIDER_ERROR) when the processor could not start the payment. Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Param        id           path  string  true  "Contract ID"
// @Param        milestoneId  path  string  true  "Milestone ID"
// @Success      202  {object}  domain.FundingResult
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Failure      502  {object}  swagger.ErrorResponse
// @Failure      503  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/fund [post]
func swaggerFundContractMilestone() {}

// swaggerSubmitContractMilestone documents POST /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/submit.
//
// @Summary      Submit milestone work
// @Description  The freelancer delivers the work for a funded milestone, with a summary and optional http(s) links. An unfunded milestone cannot be submitted against (409): escrow means nobody works on a step that has not been paid for. The client on the contract gets 403. Requires a valid Bearer access token.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id           path  string                         true  "Contract ID"
// @Param        milestoneId  path  string                         true  "Milestone ID"
// @Param        request      body  domain.SubmitMilestonePayload  true  "Delivery"
// @Success      200  {object}  domain.ContractMilestone
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/submit [post]
func swaggerSubmitContractMilestone() {}

// swaggerRequestMilestoneRevision documents POST /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/request-revision.
//
// @Summary      Request milestone revision
// @Description  The client sends submitted work back to the freelancer with a reason. The milestone returns to in_progress and its money stays in escrow. Requires a valid Bearer access token.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id           path  string                         true  "Contract ID"
// @Param        milestoneId  path  string                         true  "Milestone ID"
// @Param        request      body  domain.RequestRevisionPayload  true  "Reason"
// @Success      200  {object}  domain.ContractMilestone
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/request-revision [post]
func swaggerRequestMilestoneRevision() {}

// swaggerApproveContractMilestone documents POST /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/approve.
//
// @Summary      Approve milestone and release escrow
// @Description  The client accepts submitted work. In one transaction the milestone and its escrowed payment move to released and a payout is recorded for the freelancer (status pending: sending payouts is not available yet). When this was the last open milestone and the milestones cover the whole contract, the contract and its project complete. Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Param        id           path  string  true  "Contract ID"
// @Param        milestoneId  path  string  true  "Milestone ID"
// @Success      200  {object}  domain.ContractMilestone
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/approve [post]
func swaggerApproveContractMilestone() {}

// swaggerFreelancePaymentWebhook documents POST /api/v1/freelance/payments/webhooks/{provider}.
//
// @Summary      Payment processor webhook
// @Description  Called by the payment processor, not by clients. Authenticated only by the processor's signature over the raw body (the sandbox processor uses an HMAC-SHA256 in X-Kirmya-Signature as sha256=<hex>); an unverifiable request is refused with 401 and changes nothing. A confirmed charge funds its milestone; a failed one frees the milestone for another attempt. Idempotent: redelivered events are acknowledged without applying twice. 404 for a provider this deployment does not use; 409 when the event cannot apply in the milestone's current state.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        provider  path  string  true  "Payment provider"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Failure      413  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/freelance/payments/webhooks/{provider} [post]
func swaggerFreelancePaymentWebhook() {}
