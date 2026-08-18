package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/compliance/domain"
)

// swaggerUpdateConsent documents POST /api/v1/compliance/consent.
//
// @Summary      Update consent
// @Description  Updates consent via the Kirmya compliance module. Requires a valid Bearer access token.
// @Tags         Compliance
// @Accept       json
// @Produce      json
// @Param        request  body  domain.UpdateConsentPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/compliance/consent [post]
func swaggerUpdateConsent() {}

// swaggerGetUserConsents documents GET /api/v1/compliance/consent.
//
// @Summary      Get user consents
// @Description  Returns user consents via the Kirmya compliance module. Requires a valid Bearer access token.
// @Tags         Compliance
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/compliance/consent [get]
func swaggerGetUserConsents() {}

// swaggerRequestDataExport documents POST /api/v1/compliance/export.
//
// @Summary      Request data export
// @Description  Request data export via the Kirmya compliance module. Requires a valid Bearer access token.
// @Tags         Compliance
// @Accept       json
// @Produce      json
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/compliance/export [post]
func swaggerRequestDataExport() {}

// swaggerDownloadDataExport documents GET /api/v1/compliance/export/download.
//
// @Summary      Download GDPR data export package
// @Description  Downloads structured JSON export package with sensitive credentials stripped.
// @Tags         Compliance
// @Produce      json
// @Success      200  {object}  domain.DataExportPackage
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/compliance/export/download [get]
func swaggerDownloadDataExport() {}

// swaggerRequestAccountDeletion documents POST /api/v1/compliance/delete-account.
//
// @Summary      Request account deletion
// @Description  Request account deletion via the Kirmya compliance module. Blocked if user is under an active legal hold.
// @Tags         Compliance
// @Accept       json
// @Produce      json
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/compliance/delete-account [post]
func swaggerRequestAccountDeletion() {}

// swaggerGetUserDataRequests documents GET /api/v1/compliance/requests.
//
// @Summary      Get user data requests
// @Description  Returns user data requests via the Kirmya compliance module.
// @Tags         Compliance
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/compliance/requests [get]
func swaggerGetUserDataRequests() {}

// swaggerGetDataInventory documents GET /api/v1/admin/data-governance/inventory.
//
// @Summary      Get data inventory catalog
// @Description  Retrieves data inventory catalog and data sensitivity classifications.
// @Tags         Admin Compliance
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/data-governance/inventory [get]
func swaggerGetDataInventory() {}

// swaggerAddInventoryItem documents POST /api/v1/admin/data-governance/inventory.
//
// @Summary      Add data inventory item
// @Description  Registers a new data entity/column in the governance catalog.
// @Tags         Admin Compliance
// @Accept       json
// @Produce      json
// @Param        request  body  domain.DataInventoryItem  true  "Inventory item"
// @Success      201  {object}  swagger.SuccessResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/data-governance/inventory [post]
func swaggerAddInventoryItem() {}

// swaggerGetAllDataRequests documents GET /api/v1/admin/compliance/dsr.
//
// @Summary      Get all Data Subject Requests
// @Description  Retrieves all pending and completed DSR requests across the platform.
// @Tags         Admin Compliance
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/dsr [get]
func swaggerGetAllDataRequests() {}

// swaggerUpdateDataRequest documents PATCH /api/v1/admin/compliance/dsr/{id}.
//
// @Summary      Update Data Subject Request status
// @Description  Updates processing status, priority, assignment, or notes for a DSR request.
// @Tags         Admin Compliance
// @Accept       json
// @Produce      json
// @Param        id       path  string              true  "Request ID"
// @Param        request  body  domain.DataRequest  true  "Update payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/dsr/{id} [patch]
func swaggerUpdateDataRequest() {}

// swaggerGetRetentionPolicies documents GET /api/v1/admin/data-governance/retention.
//
// @Summary      Get data retention policies
// @Tags         Admin Compliance
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/data-governance/retention [get]
func swaggerGetRetentionPolicies() {}

// swaggerUpdateRetentionPolicy documents PUT /api/v1/admin/data-governance/retention.
//
// @Summary      Update retention policy
// @Tags         Admin Compliance
// @Accept       json
// @Produce      json
// @Param        request  body  domain.RetentionPolicyItem  true  "Policy payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/data-governance/retention [put]
func swaggerUpdateRetentionPolicy() {}

// swaggerRunRetention documents POST /api/v1/admin/data-governance/retention/run.
//
// @Summary      Run retention evaluation or purge
// @Description  Triggers retention purge evaluation in dry-run or live mode.
// @Tags         Admin Compliance
// @Accept       json
// @Produce      json
// @Param        request  body  domain.RunRetentionPayload  true  "Run payload"
// @Success      200  {object}  domain.DryRunResult
// @Security     BearerAuth
// @Router       /api/v1/admin/data-governance/retention/run [post]
func swaggerRunRetention() {}

// swaggerGetLegalHolds documents GET /api/v1/admin/compliance/legal-holds.
//
// @Summary      Get active and released legal holds
// @Tags         Admin Compliance
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/legal-holds [get]
func swaggerGetLegalHolds() {}

// swaggerCreateLegalHold documents POST /api/v1/admin/compliance/legal-holds.
//
// @Summary      Create legal hold
// @Description  Places a legal hold on a target user, shielding their records from retention purge and account deletion.
// @Tags         Admin Compliance
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreateLegalHoldPayload  true  "Legal hold payload"
// @Success      201  {object}  domain.LegalHoldItem
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/legal-holds [post]
func swaggerCreateLegalHold() {}

// swaggerReleaseLegalHold documents PATCH /api/v1/admin/compliance/legal-holds/{id}/release.
//
// @Summary      Release legal hold
// @Tags         Admin Compliance
// @Param        id  path  string  true  "Hold ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/legal-holds/{id}/release [patch]
func swaggerReleaseLegalHold() {}

// swaggerGetAccessReviews documents GET /api/v1/admin/compliance/access-reviews.
//
// @Summary      Get privileged access reviews
// @Tags         Admin Compliance
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/access-reviews [get]
func swaggerGetAccessReviews() {}

// swaggerCreateAccessReview documents POST /api/v1/admin/compliance/access-reviews.
//
// @Summary      Submit access review decision
// @Tags         Admin Compliance
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreateAccessReviewPayload  true  "Review payload"
// @Success      201  {object}  domain.DataAccessReviewItem
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/access-reviews [post]
func swaggerCreateAccessReview() {}

// swaggerGetThirdPartyProcessors documents GET /api/v1/admin/data-governance/processors.
//
// @Summary      Get third-party processors
// @Tags         Admin Compliance
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/data-governance/processors [get]
func swaggerGetThirdPartyProcessors() {}

// swaggerAddThirdPartyProcessor documents POST /api/v1/admin/data-governance/processors.
//
// @Summary      Register third-party processor
// @Tags         Admin Compliance
// @Accept       json
// @Produce      json
// @Param        request  body  domain.ThirdPartyProcessorItem  true  "Processor payload"
// @Success      201  {object}  domain.ThirdPartyProcessorItem
// @Security     BearerAuth
// @Router       /api/v1/admin/data-governance/processors [post]
func swaggerAddThirdPartyProcessor() {}

// swaggerGetDataQualityChecks documents GET /api/v1/admin/data-governance/quality-checks.
//
// @Summary      Get data quality checks
// @Tags         Admin Compliance
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/data-governance/quality-checks [get]
func swaggerGetDataQualityChecks() {}

// swaggerRunQualityCheck documents POST /api/v1/admin/data-governance/quality-checks/run.
//
// @Summary      Execute data quality check
// @Tags         Admin Compliance
// @Accept       json
// @Produce      json
// @Success      200  {object}  domain.DataQualityCheckItem
// @Security     BearerAuth
// @Router       /api/v1/admin/data-governance/quality-checks/run [post]
func swaggerRunQualityCheck() {}

// swaggerGetPrivacyRiskSummary documents GET /api/v1/admin/compliance/risk-summary.
//
// @Summary      Get privacy risk summary score
// @Tags         Admin Compliance
// @Produce      json
// @Success      200  {object}  domain.PrivacyRiskSummary
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/risk-summary [get]
func swaggerGetPrivacyRiskSummary() {}

// swaggerGetComplianceOverview documents GET /api/v1/admin/compliance/overview.
//
// @Summary      Get compliance status overview
// @Tags         Admin Compliance
// @Produce      json
// @Success      200  {object}  domain.ComplianceOverview
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/overview [get]
func swaggerGetComplianceOverview() {}

// swaggerGetPrivacyIncidents documents GET /api/v1/admin/compliance/incidents.
//
// @Summary      Get privacy incidents
// @Tags         Admin Compliance
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/incidents [get]
func swaggerGetPrivacyIncidents() {}

// swaggerCreatePrivacyIncident documents POST /api/v1/admin/compliance/incidents.
//
// @Summary      Log privacy incident
// @Tags         Admin Compliance
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreatePrivacyIncidentPayload  true  "Incident payload"
// @Success      201  {object}  domain.PrivacyIncidentItem
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/incidents [post]
func swaggerCreatePrivacyIncident() {}

// swaggerGetPolicyVersions documents GET /api/v1/admin/compliance/policy-versions.
//
// @Summary      Get policy versions
// @Tags         Admin Compliance
// @Produce      json
// @Success      200  {object}  swagger.PaginationResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/policy-versions [get]
func swaggerGetPolicyVersions() {}

// swaggerCreatePolicyVersion documents POST /api/v1/admin/compliance/policy-versions.
//
// @Summary      Create policy version
// @Tags         Admin Compliance
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreatePolicyVersionPayload  true  "Version payload"
// @Success      201  {object}  domain.PolicyVersionItem
// @Security     BearerAuth
// @Router       /api/v1/admin/compliance/policy-versions [post]
func swaggerCreatePolicyVersion() {}

var (
	_ domain.UpdateConsentPayload
	_ domain.DataExportPackage
	_ swagger.ErrorResponse
)
