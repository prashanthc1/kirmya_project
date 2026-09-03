package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/legal/models"
)

// swaggerLegalGetDocument documents GET /api/v1/legal/documents/{slug}
//
// @Summary      Get legal document
// @Description  Retrieves current legal document (terms, privacy policy, AI safety terms)
// @Tags         Legal & Compliance
// @Produce      json
// @Param        slug  path      string  true  "Document slug (e.g. terms, privacy)"
// @Success      200   {object}  swagger.SuccessResponse
// @Failure      404   {object}  swagger.ErrorResponse
// @Router       /api/v1/legal/documents/{slug} [get]
func swaggerLegalGetDocument() {}

// swaggerLegalGetDocumentVersions documents GET /api/v1/legal/documents/{slug}/versions
//
// @Summary      Get legal document revision history
// @Description  Returns version history and changelog for a legal policy
// @Tags         Legal & Compliance
// @Produce      json
// @Param        slug  path      string  true  "Document slug"
// @Success      200   {object}  swagger.SuccessResponse
// @Failure      404   {object}  swagger.ErrorResponse
// @Router       /api/v1/legal/documents/{slug}/versions [get]
func swaggerLegalGetDocumentVersions() {}

// swaggerCookiesGet documents GET /api/v1/cookies
//
// @Summary      Get platform cookie registry
// @Description  Returns categorized list of cookies used across the application
// @Tags         Legal & Compliance
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/cookies [get]
func swaggerCookiesGet() {}

// swaggerCookiesConsent documents POST /api/v1/cookies/consent
//
// @Summary      Save cookie consent
// @Description  Records user or guest cookie category preferences
// @Tags         Legal & Compliance
// @Accept       json
// @Produce      json
// @Param        request  body      models.SaveCookieConsentRequest  true  "Consent preferences"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/cookies/consent [post]
func swaggerCookiesConsent() {}

// swaggerPrivacyGet documents GET /api/v1/privacy
//
// @Summary      Get user privacy settings
// @Description  Returns data sharing, visibility and communication privacy preferences
// @Tags         Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy [get]
func swaggerPrivacyGet() {}

// swaggerPrivacyUpdate documents PUT /api/v1/privacy
//
// @Summary      Update user privacy settings
// @Description  Updates profile discovery, personalization and telemetry sharing settings
// @Tags         Privacy
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.UpdatePrivacyPreferencesPayload  true  "Privacy settings"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy [put]
func swaggerPrivacyUpdate() {}

// swaggerPrivacyCookiesGet documents GET /api/v1/privacy/cookies
//
// @Summary      Get user cookie preferences
// @Description  Returns user cookie category opt-ins
// @Tags         Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/cookies [get]
func swaggerPrivacyCookiesGet() {}

// swaggerPrivacyCookiesPut documents PUT /api/v1/privacy/cookies
//
// @Summary      Update user cookie preferences
// @Description  Updates user cookie category opt-ins
// @Tags         Privacy
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.SaveCookieConsentRequest  true  "Cookie preferences"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/cookies [put]
func swaggerPrivacyCookiesPut() {}

// swaggerPrivacyConsentsGet documents GET /api/v1/privacy/consents
//
// @Summary      Get consent audit log
// @Description  Returns timestamped log of terms and privacy policy consents
// @Tags         Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/consents [get]
func swaggerPrivacyConsentsGet() {}

// swaggerPrivacyConsentsPost documents POST /api/v1/privacy/consents
//
// @Summary      Record policy consent
// @Description  Submits affirmative consent to updated policy versions
// @Tags         Privacy
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.ConsentRecordPayload  true  "Consent details"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/consents [post]
func swaggerPrivacyConsentsPost() {}

// swaggerPrivacyExportGet documents GET /api/v1/privacy/export
//
// @Summary      List data export jobs
// @Description  Returns history of personal data export archives
// @Tags         Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/export [get]
func swaggerPrivacyExportGet() {}

// swaggerPrivacyExportPost documents POST /api/v1/privacy/export
//
// @Summary      Request personal data export
// @Description  Initiates GDPR/CCPA personal data package generation
// @Tags         Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/export [post]
func swaggerPrivacyExportPost() {}

// swaggerPrivacyExportByID documents GET /api/v1/privacy/export/{id}
//
// @Summary      Get data export download status
// @Description  Returns archive download link and completion status
// @Tags         Privacy
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Export job ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/export/{id} [get]
func swaggerPrivacyExportByID() {}

// swaggerPrivacyRequestsGet documents GET /api/v1/privacy/requests
//
// @Summary      List privacy / DSR requests
// @Description  Returns list of data subject requests submitted by the user
// @Tags         Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/requests [get]
func swaggerPrivacyRequestsGet() {}

// swaggerPrivacyRequestsPost documents POST /api/v1/privacy/requests
//
// @Summary      Submit privacy / DSR request
// @Description  Creates a new GDPR/CCPA data access, correction or deletion request
// @Tags         Privacy
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreatePrivacyRequestPayload  true  "DSR details"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/requests [post]
func swaggerPrivacyRequestsPost() {}

// swaggerPrivacyRequestByID documents GET /api/v1/privacy/requests/{id}
//
// @Summary      Get privacy request details
// @Description  Returns status and fulfillment notes for a DSR request
// @Tags         Privacy
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Request ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/requests/{id} [get]
func swaggerPrivacyRequestByID() {}

// swaggerPrivacyDeleteAccount documents POST /api/v1/privacy/delete-account
//
// @Summary      Request account deletion
// @Description  Schedules permanent account and data deletion with a 30-day grace period
// @Tags         Privacy
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.DeleteAccountPayload  true  "Confirmation"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/delete-account [post]
func swaggerPrivacyDeleteAccount() {}

// swaggerPrivacyDeleteAccountCancel documents POST /api/v1/privacy/delete-account/cancel
//
// @Summary      Cancel account deletion
// @Description  Cancels scheduled account deletion during grace period
// @Tags         Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/delete-account/cancel [post]
func swaggerPrivacyDeleteAccountCancel() {}

// swaggerPrivacyRetentionGet documents GET /api/v1/privacy/retention
//
// @Summary      Get data retention policies
// @Description  Returns platform data lifecycle and retention periods
// @Tags         Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/privacy/retention [get]
func swaggerPrivacyRetentionGet() {}

// swaggerAdminLegalDocuments documents GET /api/v1/admin/legal/documents
//
// @Summary      List legal documents (Admin)
// @Description  Returns administrative overview of all managed policy documents
// @Tags         Admin Legal
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/legal/documents [get]
func swaggerAdminLegalDocuments() {}

// swaggerAdminLegalRequests documents GET /api/v1/admin/legal/privacy-requests
//
// @Summary      List all privacy requests (Admin)
// @Description  Returns global queue of data subject requests
// @Tags         Admin Legal
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/legal/privacy-requests [get]
func swaggerAdminLegalRequests() {}

// swaggerAdminLegalRetention documents GET /api/v1/admin/legal/retention
//
// @Summary      Get retention rules (Admin)
// @Description  Returns compliance retention configuration
// @Tags         Admin Legal
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/legal/retention [get]
func swaggerAdminLegalRetention() {}

// swaggerAdminLegalHolds documents GET /api/v1/admin/legal/legal-holds
//
// @Summary      List legal holds (Admin)
// @Description  Returns accounts and records preserved under legal hold
// @Tags         Admin Legal
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/legal/legal-holds [get]
func swaggerAdminLegalHolds() {}

// swaggerAdminPrivacySummary documents GET /api/v1/admin/privacy
//
// @Summary      Get privacy dashboard summary (Admin)
// @Description  Returns compliance metrics, open DSR counts, and consent rates
// @Tags         Admin Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/privacy [get]
func swaggerAdminPrivacySummary() {}

// swaggerAdminPrivacyRequests documents GET /api/v1/admin/privacy/requests
//
// @Summary      List DSR queue (Admin)
// @Description  Returns full list of data subject requests
// @Tags         Admin Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/privacy/requests [get]
func swaggerAdminPrivacyRequests() {}

// swaggerAdminPrivacyRequestByID documents GET /api/v1/admin/privacy/requests/{id}
//
// @Summary      Get DSR case details (Admin)
// @Description  Returns individual DSR request details
// @Tags         Admin Privacy
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Request ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/privacy/requests/{id} [get]
func swaggerAdminPrivacyRequestByID() {}

// swaggerAdminPrivacyRequestUpdate documents PUT /api/v1/admin/privacy/requests/{id}
//
// @Summary      Update DSR case status (Admin)
// @Description  Updates fulfillment status, notes, or rejection reason for a DSR
// @Tags         Admin Privacy
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                        true  "Request ID"
// @Param        payload  body      models.UpdatePrivacyPayload   true  "Status update"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/privacy/requests/{id} [put]
func swaggerAdminPrivacyRequestUpdate() {}

// swaggerAdminPrivacyConsents documents GET /api/v1/admin/privacy/consents
//
// @Summary      Get global consent records (Admin)
// @Description  Returns audit trail of user consents
// @Tags         Admin Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/privacy/consents [get]
func swaggerAdminPrivacyConsents() {}

// swaggerAdminPrivacyRetentionGet documents GET /api/v1/admin/privacy/retention
//
// @Summary      Get retention schedules (Admin)
// @Description  Returns configured retention periods
// @Tags         Admin Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/privacy/retention [get]
func swaggerAdminPrivacyRetentionGet() {}

// swaggerAdminPrivacyRetentionPut documents PUT /api/v1/admin/privacy/retention
//
// @Summary      Update retention schedule (Admin)
// @Description  Updates retention duration for a data category
// @Tags         Admin Privacy
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        payload  body      models.UpdateRetentionPayload  true  "Retention schedule"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/privacy/retention [put]
func swaggerAdminPrivacyRetentionPut() {}

// swaggerAdminPrivacyDataProcessing documents GET /api/v1/admin/privacy/data-processing
//
// @Summary      Get Article 30 ROPA records (Admin)
// @Description  Returns Record of Processing Activities (ROPA)
// @Tags         Admin Privacy
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/privacy/data-processing [get]
func swaggerAdminPrivacyDataProcessing() {}

// swaggerAdminPrivacyExport documents POST /api/v1/admin/privacy/export
//
// @Summary      Export user data package (Admin)
// @Description  Generates compliance export for a designated user account
// @Tags         Admin Privacy
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        payload  body      models.AdminExportPayload  true  "Target user"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/privacy/export [post]
func swaggerAdminPrivacyExport() {}

var (
	_ models.LegalDocument
	_ swagger.ErrorResponse
)

