package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/verification/domain"
)

// This file carries the OpenAPI (swagger) contract for the verification module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerCreateRequest documents POST /api/v1/verifications/requests.
//
// @Summary      Create request
// @Description  Creates request via the Kirmya verification module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreateVerificationRequestPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/verifications/requests [post]
func swaggerCreateRequest() {}

// swaggerGetUserRequests documents GET /api/v1/verifications/requests.
//
// @Summary      Get user requests
// @Description  Returns user requests via the Kirmya verification module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/verifications/requests [get]
func swaggerGetUserRequests() {}

// swaggerGetStatus documents GET /api/v1/verifications/status.
//
// @Summary      Get status
// @Description  Returns status via the Kirmya verification module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/verifications/status [get]
func swaggerGetStatus() {}

// swaggerUpdatePrivacy documents PUT /api/v1/verifications/privacy.
//
// @Summary      Update privacy
// @Description  Updates privacy via the Kirmya verification module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body  domain.UpdatePrivacyPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/verifications/privacy [put]
func swaggerUpdatePrivacy() {}

// swaggerAddDocument documents POST /api/v1/verifications/documents.
//
// @Summary      Add document
// @Description  Adds document via the Kirmya verification module. Requires a valid Bearer access token.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body  AddDocumentPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/verifications/documents [post]
func swaggerAddDocument() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.UpdatePrivacyPayload
	_ swagger.ErrorResponse
)
