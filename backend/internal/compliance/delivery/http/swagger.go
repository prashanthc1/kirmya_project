package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/compliance/domain"
)

// This file carries the OpenAPI (swagger) contract for the compliance module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerUpdateConsent documents POST /api/v1/compliance/consent.
//
// @Summary      Update consent
// @Description  Updates consent via the Kirmya compliance module. Requires a valid Bearer access token.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        request  body  domain.UpdateConsentPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/compliance/consent [post]
func swaggerUpdateConsent() {}

// swaggerGetUserConsents documents GET /api/v1/compliance/consent.
//
// @Summary      Get user consents
// @Description  Returns user consents via the Kirmya compliance module. Requires a valid Bearer access token.
// @Tags         Admin
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/compliance/consent [get]
func swaggerGetUserConsents() {}

// swaggerRequestDataExport documents POST /api/v1/compliance/export.
//
// @Summary      Request data export
// @Description  Request data export via the Kirmya compliance module. Requires a valid Bearer access token.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/compliance/export [post]
func swaggerRequestDataExport() {}

// swaggerRequestAccountDeletion documents POST /api/v1/compliance/delete-account.
//
// @Summary      Request account deletion
// @Description  Request account deletion via the Kirmya compliance module. Requires a valid Bearer access token.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/compliance/delete-account [post]
func swaggerRequestAccountDeletion() {}

// swaggerGetUserDataRequests documents GET /api/v1/compliance/requests.
//
// @Summary      Get user data requests
// @Description  Returns user data requests via the Kirmya compliance module. Requires a valid Bearer access token.
// @Tags         Admin
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/compliance/requests [get]
func swaggerGetUserDataRequests() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.UpdateConsentPayload
	_ swagger.ErrorResponse
)
