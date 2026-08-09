package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/native_mobile/domain"
)

// This file carries the OpenAPI (swagger) contract for the native mobile module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerRefreshToken documents POST /api/v1/mobile/auth/refresh.
//
// @Summary      Refresh token
// @Description  Refreshes token via the Kirmya native mobile module. Public endpoint; no authentication required.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  domain.RefreshTokenPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/mobile/auth/refresh [post]
func swaggerRefreshToken() {}

// swaggerRegisterDevice documents POST /api/v1/mobile/devices/register.
//
// @Summary      Register device
// @Description  Registers device via the Kirmya native mobile module. Requires a valid Bearer access token.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  domain.UserDevice  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mobile/devices/register [post]
func swaggerRegisterDevice() {}

// swaggerSendPushNotification documents POST /api/v1/mobile/push/send.
//
// @Summary      Send push notification
// @Description  Sends push notification via the Kirmya native mobile module. Requires a valid Bearer access token.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  domain.PushNotificationPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mobile/push/send [post]
func swaggerSendPushNotification() {}

// swaggerGetMobileUserProfile documents GET /api/v1/mobile/user/profile.
//
// @Summary      Get mobile user profile
// @Description  Returns mobile user profile via the Kirmya native mobile module. Requires a valid Bearer access token.
// @Tags         Users
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mobile/user/profile [get]
func swaggerGetMobileUserProfile() {}

// swaggerGetMobileUserJobs documents GET /api/v1/mobile/user/jobs.
//
// @Summary      Get mobile user jobs
// @Description  Returns mobile user jobs via the Kirmya native mobile module. Requires a valid Bearer access token.
// @Tags         Users
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mobile/user/jobs [get]
func swaggerGetMobileUserJobs() {}

// swaggerGetMobileUserApplications documents GET /api/v1/mobile/user/applications.
//
// @Summary      Get mobile user applications
// @Description  Returns mobile user applications via the Kirmya native mobile module. Requires a valid Bearer access token.
// @Tags         Users
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mobile/user/applications [get]
func swaggerGetMobileUserApplications() {}

// swaggerGetMobileUserMessages documents GET /api/v1/mobile/user/messages.
//
// @Summary      Get mobile user messages
// @Description  Returns mobile user messages via the Kirmya native mobile module. Requires a valid Bearer access token.
// @Tags         Users
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mobile/user/messages [get]
func swaggerGetMobileUserMessages() {}

// swaggerGetMobileUserNotifications documents GET /api/v1/mobile/user/notifications.
//
// @Summary      Get mobile user notifications
// @Description  Returns mobile user notifications via the Kirmya native mobile module. Requires a valid Bearer access token.
// @Tags         Users
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mobile/user/notifications [get]
func swaggerGetMobileUserNotifications() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.PushNotificationPayload
	_ swagger.ErrorResponse
)
