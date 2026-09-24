package http

// The OpenAPI contract for disputes and refunds. As in swagger.go, these
// functions have no runtime role: swaggo reads their annotations. Regenerate the
// spec with `make swagger` after changing anything here.

// swaggerOpenMilestoneDispute documents POST /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/dispute.
//
// @Summary      Open a dispute on a milestone
// @Description  Either party to the contract raises a dispute on a milestone whose money is held in escrow (funded, in progress or submitted). The milestone is frozen - it cannot be submitted, approved, revised or refunded - and the contract and project move to disputed until the dispute is withdrawn or decided by a Kirmya administrator. reason is one of work_not_delivered, quality, scope, unresponsive, other; detail is required. One open dispute per contract (409). Anyone not on the contract gets 404. Requires a valid Bearer access token.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id           path  string                     true  "Contract ID"
// @Param        milestoneId  path  string                     true  "Milestone ID"
// @Param        request      body  domain.OpenDisputePayload  true  "Dispute"
// @Success      201  {object}  domain.Dispute
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/dispute [post]
func swaggerOpenMilestoneDispute() {}

// swaggerRefundContractMilestone documents POST /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/refund.
//
// @Summary      Refund a milestone to the client
// @Description  The freelancer returns a funded milestone's escrowed money to the client, which cancels the milestone and returns its amount to the contract's unallocated value. Only the freelancer: it is their payment to give up. A client who wants money back without the freelancer's agreement opens a dispute. A disputed milestone is refunded by the dispute's decision, not here (409). The refund goes through the payment processor that holds the money: 503 FREELANCE_PAYMENTS_UNAVAILABLE without it, 502 FREELANCE_PAYMENT_PROVIDER_ERROR if it refuses, and in both cases nothing changes. Requires a valid Bearer access token.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id           path  string                         true  "Contract ID"
// @Param        milestoneId  path  string                         true  "Milestone ID"
// @Param        request      body  domain.RefundMilestonePayload  true  "Reason"
// @Success      200  {object}  domain.ContractMilestone
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Failure      502  {object}  swagger.ErrorResponse
// @Failure      503  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/contracts/{id}/milestones/{milestoneId}/refund [post]
func swaggerRefundContractMilestone() {}

// swaggerListContractDisputes documents GET /api/v1/freelance/contracts/{id}/disputes.
//
// @Summary      List a contract's disputes
// @Description  Every dispute on the contract, newest first, for either party. Anyone else gets 404. Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Param        id  path  string  true  "Contract ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/contracts/{id}/disputes [get]
func swaggerListContractDisputes() {}

// swaggerGetFreelanceDispute documents GET /api/v1/freelance/disputes/{id}.
//
// @Summary      Get a dispute
// @Description  A dispute with its milestone and all evidence, for either party to the contract. Both sides see everything submitted. Anyone else gets 404. Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Param        id  path  string  true  "Dispute ID"
// @Success      200  {object}  domain.DisputeDetail
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/disputes/{id} [get]
func swaggerGetFreelanceDispute() {}

// swaggerAddDisputeEvidence documents POST /api/v1/freelance/disputes/{id}/evidence.
//
// @Summary      Add evidence to a dispute
// @Description  Either party adds a note (body required) or a link or file reference (file_url, an http(s) link, required) to an open dispute. Refused with 409 once the dispute is withdrawn or decided. Requires a valid Bearer access token.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id       path  string                     true  "Dispute ID"
// @Param        request  body  domain.AddEvidencePayload  true  "Evidence"
// @Success      201  {object}  domain.DisputeEvidence
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/disputes/{id}/evidence [post]
func swaggerAddDisputeEvidence() {}

// swaggerWithdrawDispute documents POST /api/v1/freelance/disputes/{id}/withdraw.
//
// @Summary      Withdraw a dispute
// @Description  The party who raised the dispute withdraws it. The milestone returns to exactly the state it was in when the dispute was opened, and the contract and project return to active. The other party gets 403; anyone else 404. Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Param        id  path  string  true  "Dispute ID"
// @Success      200  {object}  domain.Dispute
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/disputes/{id}/withdraw [post]
func swaggerWithdrawDispute() {}

// swaggerAdminListFreelanceDisputes documents GET /api/v1/admin/freelance/disputes.
//
// @Summary      List freelance disputes
// @Description  The administrative dispute queue, oldest first. Requires an administrator session AND the freelance.admin.read permission. status narrows it: open (the default, every dispute awaiting a decision), all, or a single dispute status.
// @Tags         Admin
// @Produce      json
// @Param        status  query  string  false  "open (default), all, or one dispute status"
// @Param        page    query  int     false  "Page number (1-based)"  default(1)
// @Param        limit   query  int     false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/freelance/disputes [get]
func swaggerAdminListFreelanceDisputes() {}

// swaggerAdminGetFreelanceDispute documents GET /api/v1/admin/freelance/disputes/{id}.
//
// @Summary      Get a freelance dispute
// @Description  One dispute with its milestone and all evidence. Requires an administrator session AND the freelance.admin.read permission.
// @Tags         Admin
// @Produce      json
// @Param        id  path  string  true  "Dispute ID"
// @Success      200  {object}  domain.DisputeDetail
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/freelance/disputes/{id} [get]
func swaggerAdminGetFreelanceDispute() {}

// swaggerAdminResolveFreelanceDispute documents POST /api/v1/admin/freelance/disputes/{id}/resolve.
//
// @Summary      Decide a freelance dispute
// @Description  Requires an administrator session AND the freelance.admin.write permission; read alone is not enough, because this moves money. outcome is release_to_freelancer (the escrowed money is released and a payout recorded, as if the client had approved), refund_to_client (the money is refunded through the payment processor and the milestone cancelled), or resume_work (no money moves; the milestone returns to in_progress). A written resolution is mandatory and is shown to both parties. The decision commits as one transaction; a refund the processor refuses changes nothing (502, or 503 without a processor). A dispute already withdrawn or decided answers 409. Recorded in the audit log with the administrator and the outcome.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        id       path  string                        true  "Dispute ID"
// @Param        request  body  domain.ResolveDisputePayload  true  "Decision"
// @Success      200  {object}  domain.Dispute
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Failure      502  {object}  swagger.ErrorResponse
// @Failure      503  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/freelance/disputes/{id}/resolve [post]
func swaggerAdminResolveFreelanceDispute() {}
