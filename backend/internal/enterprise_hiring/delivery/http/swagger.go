package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/enterprise_hiring/domain"
)

// This file carries the OpenAPI (swagger) contract for the enterprise hiring module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetOverview documents GET /api/v1/enterprise/overview.
//
// @Summary      Get overview
// @Description  Returns overview via the Kirmya enterprise hiring module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/enterprise/overview [get]
func swaggerGetOverview() {}

// swaggerGetTeams documents GET /api/v1/enterprise/teams.
//
// @Summary      Get teams
// @Description  Returns teams via the Kirmya enterprise hiring module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/enterprise/teams [get]
func swaggerGetTeams() {}

// swaggerCreateTeam documents POST /api/v1/enterprise/teams.
//
// @Summary      Create team
// @Description  Creates team via the Kirmya enterprise hiring module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreateTeamPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/enterprise/teams [post]
func swaggerCreateTeam() {}

// swaggerGetCandidatePools documents GET /api/v1/enterprise/pools.
//
// @Summary      Get candidate pools
// @Description  Returns candidate pools via the Kirmya enterprise hiring module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/enterprise/pools [get]
func swaggerGetCandidatePools() {}

// swaggerCreateCandidatePool documents POST /api/v1/enterprise/pools.
//
// @Summary      Create candidate pool
// @Description  Creates candidate pool via the Kirmya enterprise hiring module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreatePoolPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/enterprise/pools [post]
func swaggerCreateCandidatePool() {}

// swaggerGetAuditLogs documents GET /api/v1/enterprise/audit-logs.
//
// @Summary      Get audit logs
// @Description  Returns audit logs via the Kirmya enterprise hiring module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/enterprise/audit-logs [get]
func swaggerGetAuditLogs() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.CreatePoolPayload
	_ swagger.ErrorResponse
)
