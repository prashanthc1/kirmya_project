package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/notification/models"
)

// swaggerListNotifications documents GET /api/v1/notifications.
//
// @Summary      List notifications
// @Description  Returns paginated list of notifications for the user
// @Tags         Notifications
// @Produce      json
// @Param        page   query     int  false  "Page number"
// @Param        limit  query     int  false  "Items per page"
// @Success      200    {object}  swagger.PaginationResponse
// @Failure      401    {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications [get]
func swaggerListNotifications() {}

// swaggerListUnread documents GET /api/v1/notifications/unread.
//
// @Summary      List unread notifications
// @Description  Returns unread notification items
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/unread [get]
func swaggerListUnread() {}

// swaggerUnreadCount documents GET /api/v1/notifications/unread-count.
//
// @Summary      Get unread notification count
// @Description  Returns count of unread notifications for badge display
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/unread-count [get]
func swaggerUnreadCount() {}

// swaggerCount documents GET /api/v1/notifications/count.
//
// @Summary      Get notification counter
// @Description  Returns total unread count
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/count [get]
func swaggerCount() {}

// swaggerHistory documents GET /api/v1/notifications/history.
//
// @Summary      Get notification history
// @Description  Returns archived and past delivered notifications
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/history [get]
func swaggerHistory() {}

// swaggerGetPreferences documents GET /api/v1/notifications/preferences.
//
// @Summary      Get notification channel preferences
// @Description  Returns in-app, email and push channel preferences
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/preferences [get]
func swaggerGetPreferences() {}

// swaggerUpdatePreference documents PUT /api/v1/notifications/preferences.
//
// @Summary      Update notification preferences
// @Description  Updates channel and category opt-ins
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        request  body      models.UpdatePreferencePayload  true  "Preferences"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/preferences [put]
func swaggerUpdatePreference() {}

// swaggerCategoryPreferencesGet documents GET /api/v1/notifications/preferences/categories.
//
// @Summary      Get category preferences
// @Description  Returns category-level notification subscriptions
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/preferences/categories [get]
func swaggerCategoryPreferencesGet() {}

// swaggerCategoryPreferencePut documents PUT /api/v1/notifications/preferences/categories/{category}.
//
// @Summary      Update category preference
// @Description  Enables or disables notifications for a specific category
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        category  path      string                          true  "Category name"
// @Param        request   body      models.UpdatePreferencePayload  true  "Preference"
// @Success      200       {object}  swagger.SuccessResponse
// @Failure      400       {object}  swagger.ErrorResponse
// @Failure      401       {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/preferences/categories/{category} [put]
func swaggerCategoryPreferencePut() {}

// swaggerQuietHoursGet documents GET /api/v1/notifications/quiet-hours.
//
// @Summary      Get quiet hours schedule
// @Description  Returns quiet hours window when alerts are silenced
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/quiet-hours [get]
func swaggerQuietHoursGet() {}

// swaggerQuietHoursPut documents PUT /api/v1/notifications/quiet-hours.
//
// @Summary      Update quiet hours schedule
// @Description  Sets start time, end time, and timezone for silenced alerts
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        request  body      models.QuietHoursSettings  true  "Quiet hours schedule"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/quiet-hours [put]
func swaggerQuietHoursPut() {}

// swaggerDevicesGet documents GET /api/v1/notifications/devices.
//
// @Summary      List registered push devices
// @Description  Returns user's mobile and desktop browsers registered for web push
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/devices [get]
func swaggerDevicesGet() {}

// swaggerDevicesPost documents POST /api/v1/notifications/devices.
//
// @Summary      Register push device token
// @Description  Registers FCM / WebPush endpoint for device notifications
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        request  body      models.RegisterDevicePayload  true  "Push device token"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/devices [post]
func swaggerDevicesPost() {}

// swaggerDevicesDelete documents DELETE /api/v1/notifications/devices/{id}.
//
// @Summary      Unregister push device
// @Description  Removes push token registration
// @Tags         Notifications
// @Produce      json
// @Param        id   path      string  true  "Device ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/devices/{id} [delete]
func swaggerDevicesDelete() {}

// swaggerMarkAllReadPost documents POST /api/v1/notifications/read-all.
//
// @Summary      Mark all notifications as read
// @Description  Marks all user's notifications as read
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/read-all [post]
func swaggerMarkAllReadPost() {}

// swaggerMarkAllReadPut documents PUT /api/v1/notifications/read-all.
//
// @Summary      Mark all notifications read (PUT)
// @Description  Idempotently marks all notifications read
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/read-all [put]
func swaggerMarkAllReadPut() {}

// swaggerClearReadPost documents POST /api/v1/notifications/clear-read.
//
// @Summary      Clear read notifications
// @Description  Deletes all previously read notifications
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/clear-read [post]
func swaggerClearReadPost() {}

// swaggerClearReadDelete documents DELETE /api/v1/notifications/read.
//
// @Summary      Delete read notifications
// @Description  Deletes all read notifications
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/read [delete]
func swaggerClearReadDelete() {}

// swaggerDigestsGet documents GET /api/v1/notifications/digests.
//
// @Summary      Get email digest preferences
// @Description  Returns weekly/daily email digest frequency
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/digests [get]
func swaggerDigestsGet() {}

// swaggerDigestsPut documents PUT /api/v1/notifications/digests.
//
// @Summary      Update email digest settings
// @Description  Sets email digest frequency
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        request  body      models.UpdatePreferencePayload  true  "Digest settings"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/digests [put]
func swaggerDigestsPut() {}

// swaggerSchedulesGet documents GET /api/v1/notifications/schedules.
//
// @Summary      List custom alert schedules
// @Description  Returns custom notification delivery schedules
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/schedules [get]
func swaggerSchedulesGet() {}

// swaggerSchedulesPost documents POST /api/v1/notifications/schedules.
//
// @Summary      Create notification schedule
// @Description  Adds custom recurring alert schedule
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        request  body      models.NotificationSchedulePayload  true  "Schedule"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/schedules [post]
func swaggerSchedulesPost() {}

// swaggerSchedulesDelete documents DELETE /api/v1/notifications/schedules/{id}.
//
// @Summary      Delete notification schedule
// @Description  Removes alert schedule
// @Tags         Notifications
// @Produce      json
// @Param        id   path      string  true  "Schedule ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/schedules/{id} [delete]
func swaggerSchedulesDelete() {}

// swaggerGetByID documents GET /api/v1/notifications/{id}.
//
// @Summary      Get notification by ID
// @Description  Returns notification details
// @Tags         Notifications
// @Produce      json
// @Param        id   path      string  true  "Notification ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/{id} [get]
func swaggerGetByID() {}

// swaggerMarkReadPost documents POST /api/v1/notifications/{id}/read.
//
// @Summary      Mark notification read
// @Description  Marks individual notification as read
// @Tags         Notifications
// @Produce      json
// @Param        id   path      string  true  "Notification ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/{id}/read [post]
func swaggerMarkReadPost() {}

// swaggerMarkReadPut documents PUT /api/v1/notifications/{id}/read.
//
// @Summary      Mark notification read (PUT)
// @Description  Idempotently marks notification read
// @Tags         Notifications
// @Produce      json
// @Param        id   path      string  true  "Notification ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/{id}/read [put]
func swaggerMarkReadPut() {}

// swaggerMarkUnreadPost documents POST /api/v1/notifications/{id}/unread.
//
// @Summary      Mark notification unread
// @Description  Restores notification to unread state
// @Tags         Notifications
// @Produce      json
// @Param        id   path      string  true  "Notification ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/{id}/unread [post]
func swaggerMarkUnreadPost() {}

// swaggerDeleteNotification documents DELETE /api/v1/notifications/{id}.
//
// @Summary      Delete notification
// @Description  Deletes an individual notification
// @Tags         Notifications
// @Produce      json
// @Param        id   path      string  true  "Notification ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/{id} [delete]
func swaggerDeleteNotification() {}

// swaggerArchiveNotification documents POST /api/v1/notifications/{id}/archive.
//
// @Summary      Archive notification
// @Description  Archives notification
// @Tags         Notifications
// @Produce      json
// @Param        id   path      string  true  "Notification ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/notifications/{id}/archive [post]
func swaggerArchiveNotification() {}

// swaggerSettingsNotificationsGet documents GET /api/v1/settings/notifications.
//
// @Summary      Get notification settings
// @Description  Returns user alert settings
// @Tags         Notifications
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/settings/notifications [get]
func swaggerSettingsNotificationsGet() {}

// swaggerSettingsNotificationsPut documents PUT /api/v1/settings/notifications.
//
// @Summary      Update notification settings
// @Description  Updates user alert settings
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Param        request  body      models.UpdatePreferencePayload  true  "Settings"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/settings/notifications [put]
func swaggerSettingsNotificationsPut() {}

// swaggerAdminNotificationsList documents GET /api/v1/admin/notifications.
//
// @Summary      List all notifications (Admin)
// @Description  Returns global platform notifications
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications [get]
func swaggerAdminNotificationsList() {}

// swaggerAdminTemplatesList documents GET /api/v1/admin/notifications/templates.
//
// @Summary      List notification templates (Admin)
// @Description  Returns email and push message templates
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/templates [get]
func swaggerAdminTemplatesList() {}

// swaggerAdminTemplateCreate documents POST /api/v1/admin/notifications/templates.
//
// @Summary      Create notification template (Admin)
// @Description  Creates a new email or push notification template
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.NotificationTemplatePayload  true  "Template"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/templates [post]
func swaggerAdminTemplateCreate() {}

// swaggerAdminTemplateByID documents GET /api/v1/admin/notifications/templates/{id}.
//
// @Summary      Get notification template (Admin)
// @Description  Returns template content and variable placeholders
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Template ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/templates/{id} [get]
func swaggerAdminTemplateByID() {}

// swaggerAdminTemplateUpdate documents PUT /api/v1/admin/notifications/templates/{id}.
//
// @Summary      Update notification template (Admin)
// @Description  Updates template body, subject or variables
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                              true  "Template ID"
// @Param        request  body      models.NotificationTemplatePayload  true  "Updates"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/templates/{id} [put]
func swaggerAdminTemplateUpdate() {}

// swaggerAdminTemplatePublish documents POST /api/v1/admin/notifications/templates/{id}/publish.
//
// @Summary      Publish template (Admin)
// @Description  Promotes draft template to active production status
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Template ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/templates/{id}/publish [post]
func swaggerAdminTemplatePublish() {}

// swaggerAdminTemplateArchive documents POST /api/v1/admin/notifications/templates/{id}/archive.
//
// @Summary      Archive template (Admin)
// @Description  Deactivates and archives a notification template
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Template ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/templates/{id}/archive [post]
func swaggerAdminTemplateArchive() {}

// swaggerAdminTemplateTest documents POST /api/v1/admin/notifications/templates/{id}/test.
//
// @Summary      Send test notification (Admin)
// @Description  Dispatches sample rendered notification to staff email/device
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                  true  "Template ID"
// @Param        request  body      models.TestSendPayload  true  "Test recipient"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/templates/{id}/test [post]
func swaggerAdminTemplateTest() {}

// swaggerAdminQueue documents GET /api/v1/admin/notifications/queue.
//
// @Summary      Get notification queue depth (Admin)
// @Description  Returns pending email/push jobs in delivery queue
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/queue [get]
func swaggerAdminQueue() {}

// swaggerAdminFailed documents GET /api/v1/admin/notifications/failed.
//
// @Summary      Get delivery failures (Admin)
// @Description  Returns failed notification delivery attempts
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/failed [get]
func swaggerAdminFailed() {}

// swaggerAdminFailures documents GET /api/v1/admin/notifications/failures.
//
// @Summary      Get notification failure metrics (Admin)
// @Description  Returns bounce rates and delivery error breakdown
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/failures [get]
func swaggerAdminFailures() {}

// swaggerAdminProviders documents GET /api/v1/admin/notifications/providers.
//
// @Summary      Get delivery providers health (Admin)
// @Description  Returns SendGrid, FCM, APNS provider uptime and latency
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/providers [get]
func swaggerAdminProviders() {}

// swaggerAdminAnalytics documents GET /api/v1/admin/notifications/analytics.
//
// @Summary      Get notification volume analytics (Admin)
// @Description  Returns dispatch volumes, open rates, and click-through rates
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/analytics [get]
func swaggerAdminAnalytics() {}

// swaggerAdminDeliveryAnalytics documents GET /api/v1/admin/notifications/delivery-analytics.
//
// @Summary      Get notification delivery breakdown (Admin)
// @Description  Returns latency and channel success percentages
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/delivery-analytics [get]
func swaggerAdminDeliveryAnalytics() {}

// swaggerAdminDeadLetters documents GET /api/v1/admin/notifications/dead-letters.
//
// @Summary      List dead letter notifications (Admin)
// @Description  Returns permanently failed notification payloads in DLQ
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/dead-letters [get]
func swaggerAdminDeadLetters() {}

// swaggerAdminRetryDeadLetter documents POST /api/v1/admin/notifications/dead-letters/{id}/retry.
//
// @Summary      Retry dead letter notification (Admin)
// @Description  Re-enqueues failed notification payload for delivery
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Dead Letter ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/dead-letters/{id}/retry [post]
func swaggerAdminRetryDeadLetter() {}

// swaggerAdminSendAnnouncement documents POST /api/v1/admin/notifications/announcement.
//
// @Summary      Broadcast system announcement (Admin)
// @Description  Sends targeted platform-wide broadcast notification to users
// @Tags         Admin Notifications
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.BroadcastAnnouncementPayload  true  "Announcement message"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/notifications/announcement [post]
func swaggerAdminSendAnnouncement() {}

// swaggerInternalNotificationEvent documents POST /api/v1/internal/notifications/events.
//
// @Summary      Ingest internal notification event
// @Description  Internal service webhook to trigger a user notification event
// @Tags         Notifications
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      object  true  "Event payload"
// @Success      202      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      500      {object}  swagger.ErrorResponse
// @Router       /api/v1/internal/notifications/events [post]
func swaggerInternalNotificationEvent() {}

var (
	_ swagger.ErrorResponse
	_ models.UpdatePreferencePayload
)
