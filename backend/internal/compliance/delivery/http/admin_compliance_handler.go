package http

import (
	"net/http"

	"kirmya/internal/compliance/domain"
	"kirmya/internal/compliance/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminComplianceHandler struct {
	svc service.ComplianceService
}

func NewAdminComplianceHandler(svc service.ComplianceService) *AdminComplianceHandler {
	return &AdminComplianceHandler{svc: svc}
}

// GetDataInventory handles GET /admin/data-governance/inventory
func (h *AdminComplianceHandler) GetDataInventory(c *gin.Context) {
	inventory, err := h.svc.GetDataInventory(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": inventory, "count": len(inventory)})
}

// AddInventoryItem handles POST /admin/data-governance/inventory
func (h *AdminComplianceHandler) AddInventoryItem(c *gin.Context) {
	var item domain.DataInventoryItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid inventory payload", "details": err.Error()})
		return
	}
	if err := h.svc.AddInventoryItem(c.Request.Context(), &item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Inventory item registered successfully", "data": item})
}

// GetAllDataRequests handles GET /admin/compliance/dsr
func (h *AdminComplianceHandler) GetAllDataRequests(c *gin.Context) {
	reqs, err := h.svc.GetAllDataRequests(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": reqs, "count": len(reqs)})
}

// UpdateDataRequest handles PATCH /admin/compliance/dsr/:id
func (h *AdminComplianceHandler) UpdateDataRequest(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	var req domain.DataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload", "details": err.Error()})
		return
	}
	req.ID = id

	if err := h.svc.UpdateDataRequest(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	updated, _ := h.svc.GetRequestByID(c.Request.Context(), id)
	c.JSON(http.StatusOK, gin.H{"message": "Data subject request updated successfully", "data": updated})
}

// GetRetentionPolicies handles GET /admin/data-governance/retention
func (h *AdminComplianceHandler) GetRetentionPolicies(c *gin.Context) {
	policies, err := h.svc.GetRetentionPolicies(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": policies, "count": len(policies)})
}

// UpdateRetentionPolicy handles PUT /admin/data-governance/retention
func (h *AdminComplianceHandler) UpdateRetentionPolicy(c *gin.Context) {
	var item domain.RetentionPolicyItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid retention policy payload", "details": err.Error()})
		return
	}

	if err := h.svc.UpdateRetentionPolicy(c.Request.Context(), &item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Retention policy updated successfully", "data": item})
}

// RunRetention handles POST /admin/data-governance/retention/run
func (h *AdminComplianceHandler) RunRetention(c *gin.Context) {
	var payload domain.RunRetentionPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid retention run payload", "details": err.Error()})
		return
	}

	result, err := h.svc.RunRetention(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Retention task executed",
		"result":  result,
	})
}

// GetLegalHolds handles GET /admin/compliance/legal-holds
func (h *AdminComplianceHandler) GetLegalHolds(c *gin.Context) {
	holds, err := h.svc.GetLegalHolds(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": holds, "count": len(holds)})
}

// CreateLegalHold handles POST /admin/compliance/legal-holds
func (h *AdminComplianceHandler) CreateLegalHold(c *gin.Context) {
	var payload domain.CreateLegalHoldPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid legal hold payload", "details": err.Error()})
		return
	}
	payload.CreatedBy = h.getAdminUserID(c)

	hold, err := h.svc.CreateLegalHold(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Legal hold created successfully", "data": hold})
}

// ReleaseLegalHold handles PATCH /admin/compliance/legal-holds/:id/release
func (h *AdminComplianceHandler) ReleaseLegalHold(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid legal hold ID"})
		return
	}

	var payload struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&payload)

	if err := h.svc.ReleaseLegalHold(c.Request.Context(), id, payload.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Legal hold released successfully"})
}

// GetAccessReviews handles GET /admin/compliance/access-reviews
func (h *AdminComplianceHandler) GetAccessReviews(c *gin.Context) {
	reviews, err := h.svc.GetAccessReviews(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": reviews, "count": len(reviews)})
}

// CreateAccessReview handles POST /admin/compliance/access-reviews
func (h *AdminComplianceHandler) CreateAccessReview(c *gin.Context) {
	var payload domain.CreateAccessReviewPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid access review payload", "details": err.Error()})
		return
	}
	payload.ReviewerID = h.getAdminUserID(c)

	review, err := h.svc.CreateAccessReview(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Access review submitted successfully", "data": review})
}

// GetThirdPartyProcessors handles GET /admin/data-governance/processors
func (h *AdminComplianceHandler) GetThirdPartyProcessors(c *gin.Context) {
	processors, err := h.svc.GetThirdPartyProcessors(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": processors, "count": len(processors)})
}

// AddThirdPartyProcessor handles POST /admin/data-governance/processors
func (h *AdminComplianceHandler) AddThirdPartyProcessor(c *gin.Context) {
	var item domain.ThirdPartyProcessorItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid processor payload", "details": err.Error()})
		return
	}

	if err := h.svc.AddThirdPartyProcessor(c.Request.Context(), &item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Third-party processor registered", "data": item})
}

// GetDataQualityChecks handles GET /admin/data-governance/quality-checks
func (h *AdminComplianceHandler) GetDataQualityChecks(c *gin.Context) {
	checks, err := h.svc.GetDataQualityChecks(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": checks, "count": len(checks)})
}

// RunQualityCheck handles POST /admin/data-governance/quality-checks/run
func (h *AdminComplianceHandler) RunQualityCheck(c *gin.Context) {
	var payload struct {
		CheckName   string `json:"check_name" binding:"required"`
		TargetTable string `json:"target_table" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quality check payload", "details": err.Error()})
		return
	}

	check, err := h.svc.RunQualityCheck(c.Request.Context(), payload.CheckName, payload.TargetTable)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data quality check completed", "data": check})
}

// GetPrivacyRiskSummary handles GET /admin/compliance/risk-summary
func (h *AdminComplianceHandler) GetPrivacyRiskSummary(c *gin.Context) {
	risk, err := h.svc.GetPrivacyRiskSummary(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": risk})
}

// GetComplianceOverview handles GET /admin/compliance/overview
func (h *AdminComplianceHandler) GetComplianceOverview(c *gin.Context) {
	overview, err := h.svc.GetComplianceOverview(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": overview})
}

// GetPrivacyIncidents handles GET /admin/compliance/incidents
func (h *AdminComplianceHandler) GetPrivacyIncidents(c *gin.Context) {
	incidents, err := h.svc.GetPrivacyIncidents(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": incidents, "count": len(incidents)})
}

// CreatePrivacyIncident handles POST /admin/compliance/incidents
func (h *AdminComplianceHandler) CreatePrivacyIncident(c *gin.Context) {
	var payload domain.CreatePrivacyIncidentPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid incident payload", "details": err.Error()})
		return
	}
	payload.ReportedBy = h.getAdminUserID(c)

	inc, err := h.svc.CreatePrivacyIncident(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Privacy incident logged", "data": inc})
}

// GetPolicyVersions handles GET /admin/compliance/policy-versions
func (h *AdminComplianceHandler) GetPolicyVersions(c *gin.Context) {
	versions, err := h.svc.GetPolicyVersions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": versions, "count": len(versions)})
}

// CreatePolicyVersion handles POST /admin/compliance/policy-versions
func (h *AdminComplianceHandler) CreatePolicyVersion(c *gin.Context) {
	var payload domain.CreatePolicyVersionPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid policy version payload", "details": err.Error()})
		return
	}
	payload.CreatedBy = h.getAdminUserID(c)

	pv, err := h.svc.CreatePolicyVersion(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Privacy policy version created", "data": pv})
}

func (h *AdminComplianceHandler) getAdminUserID(c *gin.Context) uuid.UUID {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		return uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	}
	return userID
}
