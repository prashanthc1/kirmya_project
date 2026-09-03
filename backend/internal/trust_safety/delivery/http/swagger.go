package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/trust_safety/domain"
	"kirmya/internal/trust_safety/models"
)

// This file carries the OpenAPI (swagger) contract for the trust and safety module.

// swaggerSubmitReport documents POST /api/v1/safety/reports.
//
// @Summary      Submit abuse or safety report
// @Description  Submits a user report against an entity (profile, job, company, message) for policy violations.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body      models.ReportSubmitPayload  true  "Report payload"
// @Success      201      {object}  models.SafetyReport
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/reports [post]
func swaggerSubmitReport() {}

// swaggerTrustSubmitReport documents POST /api/v1/trust/reports.
//
// @Summary      Submit trust report
// @Description  Submits an abuse or safety report via the trust endpoint.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body      models.ReportSubmitPayload  true  "Report payload"
// @Success      201      {object}  models.SafetyReport
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/trust/reports [post]
func swaggerTrustSubmitReport() {}

// swaggerGetReports documents GET /api/v1/safety/reports.
//
// @Summary      Get user-submitted safety reports
// @Description  Returns history of abuse reports submitted by the authenticated user.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {array}   models.SafetyReport
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/reports [get]
func swaggerGetReports() {}

// swaggerTrustGetReports documents GET /api/v1/trust/reports.
//
// @Summary      Get trust reports
// @Description  Returns history of abuse reports submitted by the authenticated user via trust endpoint.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {array}   models.SafetyReport
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/trust/reports [get]
func swaggerTrustGetReports() {}

// swaggerGetReportByID documents GET /api/v1/safety/reports/{id}.
//
// @Summary      Get safety report details
// @Description  Returns resolution status of a submitted report.
// @Tags         Trust & Safety
// @Produce      json
// @Param        id   path      string  true  "Report ID"
// @Success      200  {object}  models.SafetyReport
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/reports/{id} [get]
func swaggerGetReportByID() {}

// swaggerBlockUserPayload documents POST /api/v1/safety/blocks.
//
// @Summary      Block entity (User, Recruiter, Company)
// @Description  Prevents messaging and profile visibility from the blocked party.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body      models.BlockUserPayload  true  "Block payload"
// @Success      201      {object}  models.UserBlock
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/blocks [post]
func swaggerBlockUserPayload() {}

// swaggerBlockUserByPath documents POST /api/v1/safety/blocks/{userId}.
//
// @Summary      Block user by ID
// @Description  Blocks a designated user ID.
// @Tags         Trust & Safety
// @Param        userId  path      string  true  "Target User ID"
// @Success      200     {object}  swagger.SuccessResponse
// @Failure      400     {object}  swagger.ErrorResponse
// @Failure      401     {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/blocks/{userId} [post]
func swaggerBlockUserByPath() {}

// swaggerUnblockUser documents DELETE /api/v1/safety/blocks/{userId}.
//
// @Summary      Unblock user
// @Description  Lifts an active block against a target user.
// @Tags         Trust & Safety
// @Param        userId  path      string  true  "Target User ID"
// @Success      200     {object}  swagger.SuccessResponse
// @Failure      400     {object}  swagger.ErrorResponse
// @Failure      401     {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/blocks/{userId} [delete]
func swaggerUnblockUser() {}

// swaggerGetUserBlocks documents GET /api/v1/safety/blocks.
//
// @Summary      Get blocked users list
// @Description  Returns list of accounts blocked by the authenticated user.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {array}   models.UserBlock
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/blocks [get]
func swaggerGetUserBlocks() {}

// swaggerMuteUser documents POST /api/v1/safety/mutes.
//
// @Summary      Mute entity (User, Community, Conversation, Job)
// @Description  Silences notifications from the muted entity without unfollowing or blocking.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body      models.MuteUserPayload  true  "Mute payload"
// @Success      201      {object}  models.UserMute
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/mutes [post]
func swaggerMuteUser() {}

// swaggerUnmuteUser documents DELETE /api/v1/safety/mutes/{id}.
//
// @Summary      Unmute entity
// @Description  Removes active mute on an entity.
// @Tags         Trust & Safety
// @Param        id   path      string  true  "Mute ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/mutes/{id} [delete]
func swaggerUnmuteUser() {}

// swaggerGetUserMutes documents GET /api/v1/safety/mutes.
//
// @Summary      Get muted entities
// @Description  Returns active mutes configured by the authenticated user.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {array}   models.UserMute
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/mutes [get]
func swaggerGetUserMutes() {}

// swaggerGetUserAppeals documents GET /api/v1/safety/appeals.
//
// @Summary      Get user restriction appeals
// @Description  Returns submitted enforcement appeals.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {array}   map[string]interface{}
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/appeals [get]
func swaggerGetUserAppeals() {}

// swaggerSubmitAppeal documents POST /api/v1/safety/appeals.
//
// @Summary      Submit restriction appeal
// @Description  Submits a formal contestation against an account or content enforcement action.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body      object  true  "Appeal details"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/appeals [post]
func swaggerSubmitAppeal() {}

// swaggerGetAppealByID documents GET /api/v1/safety/appeals/{id}.
//
// @Summary      Get appeal status
// @Description  Returns review status of an enforcement appeal.
// @Tags         Trust & Safety
// @Produce      json
// @Param        id   path      string  true  "Appeal ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/appeals/{id} [get]
func swaggerGetAppealByID() {}

// swaggerGetUserRestrictions documents GET /api/v1/safety/restrictions.
//
// @Summary      Get user active restrictions
// @Description  Returns active restrictions and warnings on the user account.
// @Tags         Trust & Safety
// @Produce      json
// @Success      200  {array}   map[string]interface{}
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/safety/restrictions [get]
func swaggerGetUserRestrictions() {}

// swaggerTrustReportAction documents POST /api/v1/trust/reports/{id}/action.
//
// @Summary      Take action on report (Trust)
// @Description  Executes a trust & safety action on an abuse report.
// @Tags         Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id       path      string  true  "Report ID"
// @Param        request  body      object  true  "Action payload"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/trust/reports/{id}/action [post]
func swaggerTrustReportAction() {}

// swaggerAdminTrustSafetySummary documents GET /api/v1/admin/trust-safety.
//
// @Summary      Get Trust & Safety overview (Admin)
// @Description  Returns open reports, high risk items, and review velocity metrics.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Success      200  {object}  models.SafetyMetricsSummary
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety [get]
func swaggerAdminTrustSafetySummary() {}

// swaggerGetAdminQueue documents GET /api/v1/admin/trust-safety/queue.
//
// @Summary      Get prioritized moderation queue (Admin)
// @Description  Returns prioritized moderation queue for safety staff.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Success      200  {array}   models.SafetyCase
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/queue [get]
func swaggerGetAdminQueue() {}

// swaggerAdminGetReports documents GET /api/v1/admin/trust-safety/reports.
//
// @Summary      List all abuse reports (Admin)
// @Description  Returns filtered user reports across the platform.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Success      200  {array}   models.SafetyReport
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/reports [get]
func swaggerAdminGetReports() {}

// swaggerAdminGetReportByID documents GET /api/v1/admin/trust-safety/reports/{id}.
//
// @Summary      Get abuse report details (Admin)
// @Description  Returns full report details, reporter telemetry, and evidence URLs.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Param        id   path      string  true  "Report ID"
// @Success      200  {object}  models.SafetyReport
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/reports/{id} [get]
func swaggerAdminGetReportByID() {}

// swaggerAdminUpdateReportStatus documents PUT /api/v1/admin/trust-safety/reports/{id}.
//
// @Summary      Update report triage status (Admin)
// @Description  Updates investigation status or assigns report to investigator.
// @Tags         Admin Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id       path      string                          true  "Report ID"
// @Param        request  body      models.UpdateReportStatusPayload true  "Status update"
// @Success      200      {object}  models.SafetyReport
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/reports/{id} [put]
func swaggerAdminUpdateReportStatus() {}

// swaggerAdminApplyReportAction documents POST /api/v1/admin/trust-safety/reports/{id}/actions.
//
// @Summary      Apply enforcement action on report (Admin)
// @Description  Executes warning, content takedown, suspension, or dismissal on report.
// @Tags         Admin Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id       path      string                   true  "Report ID"
// @Param        request  body      object                   true  "Enforcement action"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/reports/{id}/actions [post]
func swaggerAdminApplyReportAction() {}

// swaggerAdminGetCases documents GET /api/v1/admin/trust-safety/cases and GET /api/v1/admin/trust-safety/incidents.
//
// @Summary      List moderation cases (Admin)
// @Description  Returns open safety investigation cases.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Success      200  {array}   models.SafetyCase
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/cases [get]
func swaggerAdminGetCases() {}

// swaggerAdminGetCaseByID documents GET /api/v1/admin/trust-safety/cases/{id}.
//
// @Summary      Get moderation case details (Admin)
// @Description  Returns case history, attached reports, AI risk score, and action audit log.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Param        id   path      string  true  "Case ID"
// @Success      200  {object}  models.SafetyCase
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/cases/{id} [get]
func swaggerAdminGetCaseByID() {}

// swaggerClaimCase documents POST /api/v1/admin/trust-safety/cases/{id}/claim.
//
// @Summary      Claim moderation case (Admin)
// @Description  Claims case ownership for the authenticated moderator.
// @Tags         Admin Trust & Safety
// @Param        id   path      string  true  "Case ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/cases/{id}/claim [post]
func swaggerClaimCase() {}

// swaggerAssignCase documents POST /api/v1/admin/trust-safety/cases/{id}/assign.
//
// @Summary      Assign moderation case (Admin)
// @Description  Assigns case to a specific safety team or staff member.
// @Tags         Admin Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id       path      string                  true  "Case ID"
// @Param        request  body      models.AssignCasePayload true  "Assignee spec"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/cases/{id}/assign [post]
func swaggerAssignCase() {}

// swaggerAdminApplyCaseAction documents POST /api/v1/admin/trust-safety/cases/{id}/actions.
//
// @Summary      Apply action on case (Admin)
// @Description  Executes enforcement decision on a moderation case.
// @Tags         Admin Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id       path      string  true  "Case ID"
// @Param        request  body      object  true  "Action payload"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/cases/{id}/actions [post]
func swaggerAdminApplyCaseAction() {}

// swaggerAdminGetAppeals documents GET /api/v1/admin/trust-safety/appeals.
//
// @Summary      List all pending appeals (Admin)
// @Description  Returns user enforcement appeals queue.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Success      200  {array}   map[string]interface{}
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/appeals [get]
func swaggerAdminGetAppeals() {}

// swaggerAdminGetAppealByID documents GET /api/v1/admin/trust-safety/appeals/{id}.
//
// @Summary      Get appeal details (Admin)
// @Description  Returns appeal rationale, original enforcement record, and past violation context.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Param        id   path      string  true  "Appeal ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/appeals/{id} [get]
func swaggerAdminGetAppealByID() {}

// swaggerAdminUpdateAppeal documents PUT /api/v1/admin/trust-safety/appeals/{id}.
//
// @Summary      Update appeal status (Admin)
// @Description  Sets appeal review status or logs internal review notes.
// @Tags         Admin Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id       path      string                     true  "Appeal ID"
// @Param        request  body      models.ResolveAppealPayload true  "Update payload"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/appeals/{id} [put]
func swaggerAdminUpdateAppeal() {}

// swaggerResolveAppeal documents POST /api/v1/admin/trust-safety/appeals/{id}/resolve.
//
// @Summary      Resolve appeal (Admin)
// @Description  Grants or denies restriction appeal, automatically triggering account reinstatement if granted.
// @Tags         Admin Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id       path      string                     true  "Appeal ID"
// @Param        request  body      models.ResolveAppealPayload true  "Resolution decision"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/appeals/{id}/resolve [post]
func swaggerResolveAppeal() {}

// swaggerGetSafetyPolicies documents GET /api/v1/admin/trust-safety/policies.
//
// @Summary      List safety policies (Admin)
// @Description  Returns active and historical trust & safety policy definitions.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Success      200  {array}   models.SafetyPolicyItem
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/policies [get]
func swaggerGetSafetyPolicies() {}

// swaggerCreateSafetyPolicy documents POST /api/v1/admin/trust-safety/policies.
//
// @Summary      Create safety policy (Admin)
// @Description  Publishes a new platform safety policy code and guidance rules.
// @Tags         Admin Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreatePolicyPayload  true  "Policy spec"
// @Success      201      {object}  models.SafetyPolicyItem
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/policies [post]
func swaggerCreateSafetyPolicy() {}

// swaggerUpdateSafetyPolicy documents PUT /api/v1/admin/trust-safety/policies/{id}.
//
// @Summary      Update safety policy (Admin)
// @Description  Modifies policy description, severity level, or guidance instructions.
// @Tags         Admin Trust & Safety
// @Accept       json
// @Produce      json
// @Param        id       path      string                     true  "Policy ID"
// @Param        request  body      models.UpdatePolicyPayload  true  "Updated policy"
// @Success      200      {object}  models.SafetyPolicyItem
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/policies/{id} [put]
func swaggerUpdateSafetyPolicy() {}

// swaggerGetModeratorWorkloads documents GET /api/v1/admin/trust-safety/workload.
//
// @Summary      Get moderator workloads (Admin)
// @Description  Returns staff assignment balance and SLA compliance rates.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Success      200  {array}   models.ModeratorWorkload
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/workload [get]
func swaggerGetModeratorWorkloads() {}

// swaggerReinstateUser documents POST /api/v1/admin/trust-safety/reinstatements.
//
// @Summary      Reinstate restricted user (Admin)
// @Description  Restores account standing and clears active penalties.
// @Tags         Admin Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body      models.ReinstateUserPayload  true  "Reinstatement spec"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/reinstatements [post]
func swaggerReinstateUser() {}

// swaggerAdminGetIncidents documents GET /api/v1/admin/trust-safety/incidents.
//
// @Summary      List safety incidents (Admin)
// @Description  Returns platform safety incidents and mass abuse events.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Success      200  {array}   models.SafetyCase
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/incidents [get]
func swaggerAdminGetIncidents() {}

// swaggerGetSafetyRules documents GET /api/v1/admin/trust-safety/rules.
//
// @Summary      Get automated safety rules (Admin)
// @Description  Returns automated abuse detection and content filter rules.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Success      200  {array}   models.SafetyRule
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/rules [get]
func swaggerGetSafetyRules() {}

// swaggerUpdateSafetyRule documents PUT /api/v1/admin/trust-safety/rules.
//
// @Summary      Update safety rule (Admin)
// @Description  Updates rule conditions or recommended mitigation actions.
// @Tags         Admin Trust & Safety
// @Accept       json
// @Produce      json
// @Param        request  body      models.SafetyRule  true  "Updated rule"
// @Success      200      {object}  models.SafetyRule
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/rules [put]
func swaggerUpdateSafetyRule() {}

// swaggerGetAnalytics documents GET /api/v1/admin/trust-safety/analytics.
//
// @Summary      Get Trust & Safety analytics (Admin)
// @Description  Returns report volume by category, action breakdown, and resolution metrics.
// @Tags         Admin Trust & Safety
// @Produce      json
// @Success      200  {object}  models.SafetyMetricsSummary
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/trust-safety/analytics [get]
func swaggerGetAnalytics() {}

var (
	_ domain.ModerationActionPayload
	_ swagger.ErrorResponse
	_ models.ClaimCasePayload
	_ models.AssignCasePayload
	_ models.ResolveAppealPayload
	_ models.UpdateReportStatusPayload
	_ models.CreatePolicyPayload
	_ models.UpdatePolicyPayload
	_ models.ReinstateUserPayload
	_ models.SafetyReport
	_ models.UserBlock
	_ models.UserMute
)
