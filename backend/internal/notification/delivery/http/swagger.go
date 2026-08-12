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

// swaggerListUnread documents GET /api/v1/notifications/unread.
//
// @Summary      List unread notifications
// @Description  Returns the unread notifications via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/unread [get]
func swaggerListUnread() {}

// swaggerGetUnreadCount documents GET /api/v1/notifications/count.
//
// @Summary      Get unread count
// @Description  Returns the number of unread notifications via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/count [get]
func swaggerGetUnreadCount() {}

// swaggerGetNotificationHistory documents GET /api/v1/notifications/history.
//
// @Summary      Get notification history
// @Description  Returns the delivered notification history via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/history [get]
func swaggerGetNotificationHistory() {}

// swaggerGetCategoryPreferences documents GET /api/v1/notifications/preferences/categories.
//
// @Summary      Get category preferences
// @Description  Returns the per-category notification preferences via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/preferences/categories [get]
func swaggerGetCategoryPreferences() {}

// swaggerUpdateCategoryPreference documents PUT /api/v1/notifications/preferences/categories/{category}.
//
// @Summary      Update category preference
// @Description  Updates the notification preference for one category via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        category  path  string  true  "Category"
// @Param        request  body  models.UpdatePreferencePayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/preferences/categories/{category} [put]
func swaggerUpdateCategoryPreference() {}

// swaggerGetQuietHours documents GET /api/v1/notifications/quiet-hours.
//
// @Summary      Get quiet hours
// @Description  Returns the quiet hours window via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/quiet-hours [get]
func swaggerGetQuietHours() {}

// swaggerUpdateQuietHours documents PUT /api/v1/notifications/quiet-hours.
//
// @Summary      Update quiet hours
// @Description  Updates the quiet hours window via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        request  body  object  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/quiet-hours [put]
func swaggerUpdateQuietHours() {}

// swaggerGetDevices documents GET /api/v1/notifications/devices.
//
// @Summary      List push devices
// @Description  Returns the registered push devices via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/devices [get]
func swaggerGetDevices() {}

// swaggerRegisterDevice documents POST /api/v1/notifications/devices.
//
// @Summary      Register push device
// @Description  Registers a device for push delivery via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        request  body  object  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/devices [post]
func swaggerRegisterDevice() {}

// swaggerDeleteDevice documents DELETE /api/v1/notifications/devices/{id}.
//
// @Summary      Delete push device
// @Description  Removes a registered push device via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Param        id  path  string  true  "Device id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/devices/{id} [delete]
func swaggerDeleteDevice() {}

// swaggerMarkAllReadPost documents POST /api/v1/notifications/read-all.
//
// @Summary      Mark all read
// @Description  Marks every notification read via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/read-all [post]
func swaggerMarkAllReadPost() {}

// swaggerGetNotificationByID documents GET /api/v1/notifications/{id}.
//
// @Summary      Get notification
// @Description  Returns one notification via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Param        id  path  string  true  "Notification id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/{id} [get]
func swaggerGetNotificationByID() {}

// swaggerMarkReadPost documents POST /api/v1/notifications/{id}/read.
//
// @Summary      Mark read
// @Description  Marks one notification read via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Notification id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/{id}/read [post]
func swaggerMarkReadPost() {}

// swaggerMarkUnread documents POST /api/v1/notifications/{id}/unread.
//
// @Summary      Mark unread
// @Description  Returns one notification to the unread state via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Notification id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/{id}/unread [post]
func swaggerMarkUnread() {}

// swaggerDeleteNotification documents DELETE /api/v1/notifications/{id}.
//
// @Summary      Delete notification
// @Description  Deletes one notification via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Param        id  path  string  true  "Notification id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/{id} [delete]
func swaggerDeleteNotification() {}

// swaggerArchiveNotification documents POST /api/v1/notifications/{id}/archive.
//
// @Summary      Archive notification
// @Description  Archives one notification via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Notification id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/{id}/archive [post]
func swaggerArchiveNotification() {}

// swaggerAdminListNotifications documents GET /api/v1/admin/notifications.
//
// @Summary      List notifications (admin)
// @Description  Returns notifications across users via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/notifications [get]
func swaggerAdminListNotifications() {}

// swaggerAdminGetTemplates documents GET /api/v1/admin/notifications/templates.
//
// @Summary      List notification templates
// @Description  Returns the notification templates via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/notifications/templates [get]
func swaggerAdminGetTemplates() {}

// swaggerAdminCreateTemplate documents POST /api/v1/admin/notifications/templates.
//
// @Summary      Create notification template
// @Description  Creates a notification template via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        request  body  object  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/notifications/templates [post]
func swaggerAdminCreateTemplate() {}

// swaggerAdminGetAnalytics documents GET /api/v1/admin/notifications/analytics.
//
// @Summary      Get notification analytics
// @Description  Returns delivery and engagement analytics via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/notifications/analytics [get]
func swaggerAdminGetAnalytics() {}

// swaggerAdminGetFailures documents GET /api/v1/admin/notifications/failures.
//
// @Summary      List delivery failures
// @Description  Returns the failed notification deliveries via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/notifications/failures [get]
func swaggerAdminGetFailures() {}

// swaggerAdminSendAnnouncement documents POST /api/v1/admin/notifications/announcement.
//
// @Summary      Send announcement
// @Description  Broadcasts an announcement notification via the Kirmya notification module. Requires a valid Bearer access token.
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        request  body  object  true  "Request payload"
// @Success      202  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/notifications/announcement [post]
func swaggerAdminSendAnnouncement() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ models.UpdatePreferencePayload
	_ swagger.ErrorResponse
)
