package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/notification/models"
)

// This file carries the OpenAPI (swagger) contract for the notification module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerListNotifications documents GET /api/v1/notifications.
//
// @Summary      List notifications
// @Description  Returns a list of notifications via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications [get]
func swaggerListNotifications() {}

// swaggerMarkRead documents PUT /api/v1/notifications/{id}/read.
//
// @Summary      Mark read
// @Description  Marks read via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/{id}/read [put]
func swaggerMarkRead() {}

// swaggerMarkAllRead documents PUT /api/v1/notifications/read-all.
//
// @Summary      Mark all read
// @Description  Marks all read via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/read-all [put]
func swaggerMarkAllRead() {}

// swaggerGetPreferences documents GET /api/v1/notifications/preferences.
//
// @Summary      Get preferences
// @Description  Returns preferences via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/preferences [get]
func swaggerGetPreferences() {}

// swaggerUpdatePreference documents PUT /api/v1/notifications/preferences.
//
// @Summary      Update preference
// @Description  Updates preference via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        request  body  models.UpdatePreferencePayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/preferences [put]
func swaggerUpdatePreference() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ models.UpdatePreferencePayload
	_ swagger.ErrorResponse
)
