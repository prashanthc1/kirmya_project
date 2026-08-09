package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/mobile/domain"
)

// This file carries the OpenAPI (swagger) contract for the mobile module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetMobileConfig documents GET /api/v1/mobile/config.
//
// @Summary      Get mobile config
// @Description  Returns mobile config via the Kirmya mobile module. Public endpoint; no authentication required.
// @Tags         Users
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/mobile/config [get]
func swaggerGetMobileConfig() {}

// swaggerGetOpenAPIDocs documents GET /api/v1/mobile/docs.
//
// @Summary      Get open API docs
// @Description  Returns open API docs via the Kirmya mobile module. Public endpoint; no authentication required.
// @Tags         Users
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/mobile/docs [get]
func swaggerGetOpenAPIDocs() {}

// swaggerRegisterDevice documents POST /api/v1/mobile/devices.
//
// @Summary      Register device
// @Description  Registers device via the Kirmya mobile module. Requires a valid Bearer access token.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  domain.RegisterDevicePayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mobile/devices [post]
func swaggerRegisterDevice() {}

// swaggerCreatePresignedUpload documents POST /api/v1/mobile/uploads/presign.
//
// @Summary      Create presigned upload
// @Description  Creates presigned upload via the Kirmya mobile module. Requires a valid Bearer access token.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  domain.PresignedUploadPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mobile/uploads/presign [post]
func swaggerCreatePresignedUpload() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.PresignedUploadPayload
	_ swagger.ErrorResponse
)
