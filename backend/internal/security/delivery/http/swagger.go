package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/security/models"
)

// This file carries the OpenAPI (swagger) contract for the security & privacy module.

// @Summary      Get Security Overview
// @Description  Returns security score, MFA status, active sessions count, trusted devices, and recent security events.
// @Tags         Security
// @Produce      json
// @Success      200  {object}  models.SecurityOverview
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/security [get]
func swaggerGetSecurityOverview() {}

// @Summary      Change Password
// @Description  Updates the user's password after validating policy rules.
// @Tags         Security
// @Accept       json
// @Produce      json
// @Param        request  body      models.PasswordChangePayload  true  "Password change details"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/security/password/change [post]
func swaggerChangePassword() {}

// @Summary      Validate Password Policy
// @Description  Evaluates a proposed password against policy rules and returns detailed criteria checks and entropy score.
// @Tags         Security
// @Accept       json
// @Produce      json
// @Success      200  {object}  models.PasswordPolicyResult
// @Router       /api/v1/security/password/validate [post]
func swaggerValidatePasswordPolicy() {}

// @Summary      Setup MFA TOTP
// @Description  Generates a new Base32 TOTP secret, QR code URI, and single-use recovery codes.
// @Tags         Security
// @Produce      json
// @Success      200  {object}  models.MFASetupResponse
// @Security     BearerAuth
// @Router       /api/v1/security/mfa/setup [post]
func swaggerSetupMFA() {}

// @Summary      Verify & Enable MFA
// @Description  Verifies 6-digit TOTP code and enables two-factor authentication for the user account.
// @Tags         Security
// @Accept       json
// @Produce      json
// @Param        request  body      models.MFAVerifyPayload  true  "TOTP verification code"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/security/mfa/verify [post]
func swaggerVerifyMFA() {}

// @Summary      Disable MFA
// @Description  Disables two-factor authentication for the user account.
// @Tags         Security
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Security     BearerAuth
// @Router       /api/v1/security/mfa/disable [post]
func swaggerDisableMFA() {}

// @Summary      Get Active Sessions
// @Description  Returns list of active sessions with IP address, user agent, location, and expiry.
// @Tags         Security
// @Produce      json
// @Success      200  {array}   models.SessionItem
// @Security     BearerAuth
// @Router       /api/v1/security/sessions [get]
func swaggerGetActiveSessions() {}

// @Summary      Revoke Session
// @Description  Revokes a specific active session by ID. Enforces IDOR ownership check.
// @Tags         Security
// @Param        id   path      string  true  "Session ID (UUID)"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      403  {object}  swagger.ErrorResponse  "IDOR forbidden"
// @Security     BearerAuth
// @Router       /api/v1/security/sessions/{id} [delete]
func swaggerRevokeSession() {}

// @Summary      Get Privacy Settings
// @Description  Returns user privacy preferences including profile visibility, analytics opt-in, and search indexing.
// @Tags         Privacy
// @Produce      json
// @Success      200  {object}  models.PrivacySettings
// @Security     BearerAuth
// @Router       /api/v1/privacy/settings [get]
func swaggerGetPrivacySettings() {}

// @Summary      Update Privacy Settings
// @Description  Updates privacy settings and logs audit event.
// @Tags         Privacy
// @Accept       json
// @Produce      json
// @Param        request  body      models.PrivacySettingsPayload  true  "Privacy settings payload"
// @Success      200      {object}  models.PrivacySettings
// @Security     BearerAuth
// @Router       /api/v1/privacy/settings [put]
func swaggerUpdatePrivacySettings() {}

// @Summary      Request Data Export
// @Description  Triggers GDPR compliant user data export generation.
// @Tags         Privacy
// @Produce      json
// @Success      202  {object}  models.DataExportRequest
// @Security     BearerAuth
// @Router       /api/v1/privacy/export [post]
func swaggerRequestDataExport() {}

// @Summary      Request Account Deletion
// @Description  Schedules account deletion with 30-day grace period and anonymization enforcement.
// @Tags         Privacy
// @Accept       json
// @Produce      json
// @Success      202  {object}  models.AccountDeletionRequest
// @Security     BearerAuth
// @Router       /api/v1/privacy/delete-account [post]
func swaggerRequestAccountDeletion() {}

var (
	_ models.SecurityOverview
	_ swagger.ErrorResponse
)
