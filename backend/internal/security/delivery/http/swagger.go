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

// @Summary      Get Account Risk Score
// @Description  Returns user's dynamic risk score (0-100), risk level, and contributing risk factors.
// @Tags         Security
// @Produce      json
// @Success      200  {object}  models.AccountRiskScore
// @Security     BearerAuth
// @Router       /api/v1/security/risk-score [get]
func swaggerGetAccountRiskScore() {}

// @Summary      Get Security Alerts List
// @Description  Returns SOC security alerts filtered by status and severity.
// @Tags         Admin Security
// @Produce      json
// @Param        status    query    string  false  "Alert status filter (New, Investigating, Mitigated, Resolved, False Positive, Escalated)"
// @Param        severity  query    string  false  "Alert severity filter (Informational, Low, Medium, High, Critical)"
// @Success      200       {array}   models.SecurityAlert
// @Security     BearerAuth
// @Router       /api/v1/admin/security/alerts [get]
func swaggerGetSecurityAlerts() {}

// @Summary      Get Security Alert Details
// @Description  Returns a specific security alert by UUID.
// @Tags         Admin Security
// @Produce      json
// @Param        id   path      string  true  "Alert ID (UUID)"
// @Success      200  {object}  models.SecurityAlert
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/security/alerts/{id} [get]
func swaggerGetSecurityAlertByID() {}

// @Summary      Update Security Alert Status
// @Description  Updates alert status, assigned admin, and resolution notes.
// @Tags         Admin Security
// @Accept       json
// @Produce      json
// @Param        id       path      string                            true  "Alert ID (UUID)"
// @Param        request  body      models.UpdateSecurityAlertPayload  true  "Alert update payload"
// @Success      200      {object}  models.SecurityAlert
// @Security     BearerAuth
// @Router       /api/v1/admin/security/alerts/{id} [put]
func swaggerUpdateSecurityAlert() {}

// @Summary      Resolve Security Alert
// @Description  Resolves a security alert with mandatory resolution notes and status (Resolved or False Positive).
// @Tags         Admin Security
// @Accept       json
// @Produce      json
// @Param        id       path      string                     true  "Alert ID (UUID)"
// @Param        request  body      models.ResolveAlertPayload  true  "Resolve alert payload"
// @Success      200      {object}  models.SecurityAlert
// @Security     BearerAuth
// @Router       /api/v1/admin/security/alerts/{id}/resolve [post]
func swaggerResolveSecurityAlert() {}

// @Summary      Get Security Rules
// @Description  Returns list of real-time security rules engine configurations.
// @Tags         Admin Security
// @Produce      json
// @Success      200  {array}   models.SecurityRule
// @Security     BearerAuth
// @Router       /api/v1/admin/security/rules [get]
func swaggerGetSecurityRules() {}

// @Summary      Update Security Rule
// @Description  Updates threshold, time window, action, or status for a security rule.
// @Tags         Admin Security
// @Accept       json
// @Produce      json
// @Param        id       path      string                           true  "Rule ID"
// @Param        request  body      models.UpdateSecurityRulePayload  true  "Rule update payload"
// @Success      200      {object}  models.SecurityRule
// @Security     BearerAuth
// @Router       /api/v1/admin/security/rules/{id} [put]
func swaggerUpdateSecurityRule() {}

// @Summary      Get Bot Detection Signals
// @Description  Returns list of logged bot activity detection signals.
// @Tags         Admin Security
// @Produce      json
// @Success      200  {array}   models.BotDetectionSignal
// @Security     BearerAuth
// @Router       /api/v1/admin/security/bot-signals [get]
func swaggerGetBotSignals() {}

// @Summary      Get Fraud Alerts
// @Description  Returns list of logged fraud detection alerts across job postings, messages, applications, and accounts.
// @Tags         Admin Security
// @Produce      json
// @Success      200  {array}   models.FraudAlert
// @Security     BearerAuth
// @Router       /api/v1/admin/security/fraud-alerts [get]
func swaggerGetFraudAlerts() {}

// @Summary      Get Account Risk Scores
// @Description  Returns risk score evaluations across all platform accounts.
// @Tags         Admin Security
// @Produce      json
// @Success      200  {array}   models.AccountRiskScore
// @Security     BearerAuth
// @Router       /api/v1/admin/security/risk-scores [get]
func swaggerGetAccountRiskScores() {}

var (
	_ models.SecurityOverview
	_ models.SecurityAlert
	_ models.SecurityRule
	_ models.AccountRiskScore
	_ models.BotDetectionSignal
	_ models.FraudAlert
	_ swagger.ErrorResponse
)

