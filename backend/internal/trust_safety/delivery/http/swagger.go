package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/trust_safety/domain"
	"kirmya/internal/trust_safety/models"
)

// This file carries the OpenAPI (swagger) contract for the trust and safety module.

// swaggerClaimCase documents POST /api/v1/admin/trust-safety/cases/{id}/claim.
//
// @Summary      Claim moderation case
// @Description  Claims a moderation case for the authenticated admin. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Case ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/cases/{id}/claim [post]
func swaggerClaimCase() {}

// swaggerAssignCase documents POST /api/v1/admin/trust-safety/cases/{id}/assign.
//
// @Summary      Assign moderation case
// @Description  Assigns a moderation case to an admin or team. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Case ID"
// @Param        request  body  models.AssignCasePayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/cases/{id}/assign [post]
func swaggerAssignCase() {}

// swaggerGetUserRestrictions documents GET /api/v1/safety/restrictions.
//
// @Summary      Get user active restrictions
// @Description  Returns active restrictions for the authenticated user. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/restrictions [get]
func swaggerGetUserRestrictions() {}

// swaggerSubmitReport documents POST /api/v1/safety/reports.
//
// @Summary      Submit report
// @Description  Submits report via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body  domain.SubmitReportPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/reports [post]
func swaggerSubmitReport() {}

// swaggerGetReports documents GET /api/v1/safety/reports.
//
// @Summary      Get reports
// @Description  Returns reports via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/reports [get]
func swaggerGetReports() {}

// swaggerExecuteModerationAction documents POST /api/v1/admin/safety/cases/{id}/actions.
//
// @Summary      Execute moderation action
// @Description  Executes moderation action via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  domain.ModerationActionPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/safety/cases/{id}/actions [post]
func swaggerExecuteModerationAction() {}

// swaggerBlockUser documents POST /api/v1/safety/blocks/{userId}.
//
// @Summary      Block user
// @Description  Blocks user via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        userId  path  string  true  "User ID"
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/blocks/{userId} [post]
func swaggerBlockUser() {}

// swaggerUnblockUser documents DELETE /api/v1/safety/blocks/{userId}.
//
// @Summary      Unblock user
// @Description  Unblocks user via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Param        userId  path  string  true  "User ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/blocks/{userId} [delete]
func swaggerUnblockUser() {}

// swaggerGetUserBlocks documents GET /api/v1/safety/blocks.
//
// @Summary      Get user blocks
// @Description  Returns user blocks via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/blocks [get]
func swaggerGetUserBlocks() {}

// swaggerGetAdminCases documents GET /api/v1/admin/safety/cases.
//
// @Summary      Get admin safety cases
// @Description  Returns admin safety cases via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/safety/cases [get]
func swaggerGetAdminCases() {}

// swaggerResolveAppeal documents POST /api/v1/admin/safety/appeals/{id}/resolve.
//
// @Summary      Resolve appeal
// @Description  Resolves appeal via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Appeal ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/safety/appeals/{id}/resolve [post]
func swaggerResolveAppeal() {}

// swaggerGetAnalytics documents GET /api/v1/admin/safety/analytics.
//
// @Summary      Get safety analytics
// @Description  Returns safety analytics via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/safety/analytics [get]
func swaggerGetAnalytics() {}

// swaggerSubmitAppeal documents POST /api/v1/safety/appeals.
//
// @Summary      Submit appeal
// @Description  Submits enforcement appeal via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/appeals [post]
func swaggerSubmitAppeal() {}

// swaggerGetAdminQueue documents GET /api/v1/admin/trust-safety/queue.
//
// @Summary      Get prioritized moderation queue
// @Description  Returns prioritized moderation queue for admins. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/queue [get]
func swaggerGetAdminQueue() {}

// swaggerGetSafetyPolicies documents GET /api/v1/admin/trust-safety/policies.
//
// @Summary      Get safety policies
// @Description  Returns safety policy items. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/policies [get]
func swaggerGetSafetyPolicies() {}

// swaggerCreateSafetyPolicy documents POST /api/v1/admin/trust-safety/policies.
//
// @Summary      Create safety policy
// @Description  Creates a new safety policy item. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body  models.CreatePolicyPayload  true  "Request payload"
// @Success      201  {object}  models.SafetyPolicyItem
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/policies [post]
func swaggerCreateSafetyPolicy() {}

// swaggerGetModeratorWorkloads documents GET /api/v1/admin/trust-safety/workload.
//
// @Summary      Get moderator workload metrics
// @Description  Returns moderator workload and SLA metrics. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/workload [get]
func swaggerGetModeratorWorkloads() {}

var (
	_ domain.ModerationActionPayload
	_ swagger.ErrorResponse
	_ models.ClaimCasePayload
	_ models.AssignCasePayload
	_ models.ResolveAppealPayload
	_ models.UpdateReportStatusPayload
	_ models.CreatePolicyPayload
	_ models.UpdatePolicyPayload
	_ models.ReinstateUserPayload
)
