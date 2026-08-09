package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/organization/domain"
)

// This file carries the OpenAPI (swagger) contract for the organization module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerCreateOrganization documents POST /api/v1/organizations.
//
// @Summary      Create organization
// @Description  Creates organization via the Kirmya organization module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreateOrganizationPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/organizations [post]
func swaggerCreateOrganization() {}

// swaggerGetOrganizationsForUser documents GET /api/v1/organizations.
//
// @Summary      Get organizations for user
// @Description  Returns organizations for user via the Kirmya organization module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/organizations [get]
func swaggerGetOrganizationsForUser() {}

// swaggerGetAllPermissions documents GET /api/v1/organizations/permissions.
//
// @Summary      Get all permissions
// @Description  Returns all permissions via the Kirmya organization module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/organizations/permissions [get]
func swaggerGetAllPermissions() {}

// swaggerAddMember documents POST /api/v1/organizations/{id}/members.
//
// @Summary      Add member
// @Description  Adds member via the Kirmya organization module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  domain.InviteMemberPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/organizations/{id}/members [post]
func swaggerAddMember() {}

// swaggerGetOrgMembers documents GET /api/v1/organizations/{id}/members.
//
// @Summary      Get org members
// @Description  Returns org members via the Kirmya organization module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/organizations/{id}/members [get]
func swaggerGetOrgMembers() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.InviteMemberPayload
	_ swagger.ErrorResponse
)
