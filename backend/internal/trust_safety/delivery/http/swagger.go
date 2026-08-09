package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/trust_safety/domain"
)

// This file carries the OpenAPI (swagger) contract for the trust and safety module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerSubmitReport documents POST /api/v1/trust/reports.
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
// @Router       /api/v1/trust/reports [post]
func swaggerSubmitReport() {}

// swaggerGetReports documents GET /api/v1/trust/reports.
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
// @Router       /api/v1/trust/reports [get]
func swaggerGetReports() {}

// swaggerExecuteModerationAction documents POST /api/v1/trust/reports/{id}/action.
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
// @Router       /api/v1/trust/reports/{id}/action [post]
func swaggerExecuteModerationAction() {}

// swaggerBlockUser documents POST /api/v1/trust/users/block.
//
// @Summary      Block user
// @Description  Blocks user via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/trust/users/block [post]
func swaggerBlockUser() {}

// swaggerGetFraudLogs documents GET /api/v1/trust/fraud-logs.
//
// @Summary      Get fraud logs
// @Description  Returns fraud logs via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/trust/fraud-logs [get]
func swaggerGetFraudLogs() {}

// swaggerGetBadges documents GET /api/v1/trust/verification.
//
// @Summary      Get badges
// @Description  Returns badges via the Kirmya trust and safety module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/trust/verification [get]
func swaggerGetBadges() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.ModerationActionPayload
	_ swagger.ErrorResponse
)
