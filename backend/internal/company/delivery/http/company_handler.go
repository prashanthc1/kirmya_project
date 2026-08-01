package http

import (
	"net/http"
	"strconv"

	"kirmya/internal/company/models"
	"kirmya/internal/company/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CompanyHandler struct {
	service *service.CompanyService
}

func NewCompanyHandler(s *service.CompanyService) *CompanyHandler {
	return &CompanyHandler{service: s}
}

// ListDirectory handles GET /api/v1/companies
func (h *CompanyHandler) ListDirectory(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12"))
	activelyHiring, _ := strconv.ParseBool(c.DefaultQuery("actively_hiring", "false"))
	verified, _ := strconv.ParseBool(c.DefaultQuery("verified", "false"))

	filter := models.CompanyFilterQuery{
		Query:          c.DefaultQuery("query", ""),
		Industry:       c.DefaultQuery("industry", ""),
		CompanySize:    c.DefaultQuery("size", ""),
		Country:        c.DefaultQuery("country", ""),
		City:           c.DefaultQuery("city", ""),
		ActivelyHiring: activelyHiring,
		Verified:       verified,
		SortBy:         c.DefaultQuery("sort", "most_relevant"),
		Page:           page,
		Limit:          limit,
	}

	userID, _ := h.getUserID(c)
	res, err := h.service.ListDirectory(c.Request.Context(), filter, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (h *CompanyHandler) GetFeaturedCompanies(c *gin.Context) {
	list, err := h.service.GetFeaturedCompanies(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *CompanyHandler) GetPopularCompanies(c *gin.Context) {
	list, err := h.service.GetPopularCompanies(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *CompanyHandler) GetIndustries(c *gin.Context) {
	industries, err := h.service.GetIndustries(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, industries)
}

func (h *CompanyHandler) RegisterCompany(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var payload models.RegisterCompanyPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	company, profile, err := h.service.RegisterCompany(c.Request.Context(), userID, &payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"company": company,
		"profile": profile,
	})
}

func (h *CompanyHandler) GetByHandle(c *gin.Context) {
	handle := c.Param("handle")
	if handle == "" {
		handle = c.Param("slug")
	}
	if handle == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Handle/Slug is required"})
		return
	}

	company, profile, err := h.service.GetByHandle(c.Request.Context(), handle)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	following := false
	val, exists := c.Get("userID")
	if exists {
		if uid, ok := val.(uuid.UUID); ok {
			following, _ = h.service.IsFollowing(c.Request.Context(), company.ID, uid)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"company":   company,
		"profile":   profile,
		"following": following,
	})
}

func (h *CompanyHandler) GetCompanyJobs(c *gin.Context) {
	idStr := c.Param("id")
	companyID, _ := uuid.Parse(idStr)
	jobs, err := h.service.GetCompanyJobs(c.Request.Context(), companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, jobs)
}

func (h *CompanyHandler) GetCompanyEmployees(c *gin.Context) {
	idStr := c.Param("id")
	companyID, _ := uuid.Parse(idStr)
	employees, err := h.service.GetCompanyEmployees(c.Request.Context(), companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, employees)
}

func (h *CompanyHandler) GetCompanyLeaders(c *gin.Context) {
	idStr := c.Param("id")
	companyID, _ := uuid.Parse(idStr)
	leaders, err := h.service.GetCompanyLeaders(c.Request.Context(), companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, leaders)
}

func (h *CompanyHandler) GetCompanyLocations(c *gin.Context) {
	idStr := c.Param("id")
	companyID, _ := uuid.Parse(idStr)
	locations, err := h.service.GetCompanyLocations(c.Request.Context(), companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, locations)
}

func (h *CompanyHandler) GetCompanyDepartments(c *gin.Context) {
	idStr := c.Param("id")
	companyID, _ := uuid.Parse(idStr)
	departments, err := h.service.GetCompanyDepartments(c.Request.Context(), companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, departments)
}

func (h *CompanyHandler) GetCompanyGallery(c *gin.Context) {
	idStr := c.Param("id")
	companyID, _ := uuid.Parse(idStr)
	gallery, err := h.service.GetCompanyGallery(c.Request.Context(), companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gallery)
}

func (h *CompanyHandler) ReportCompany(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}

	var payload models.ReportCompanyPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.service.ReportCompany(c.Request.Context(), companyID, userID, payload.Reason, payload.Details)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Report submitted successfully"})
}

func (h *CompanyHandler) UpdateProfile(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}

	var payload models.UpdateProfilePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.service.UpdateProfile(c.Request.Context(), userID, companyID, &payload)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

func (h *CompanyHandler) FollowCompany(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var payload struct {
		CompanyID string `json:"company_id"`
	}
	_ = c.ShouldBindJSON(&payload)

	companyIDStr := payload.CompanyID
	if companyIDStr == "" {
		companyIDStr = c.Param("id")
	}
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}

	following, err := h.service.FollowCompany(c.Request.Context(), companyID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"following": following,
		"message":   "Follow state updated",
	})
}

func (h *CompanyHandler) UnfollowCompany(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"following": false, "message": "Unfollowed successfully"})
}

func (h *CompanyHandler) SaveCompany(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"saved": true, "message": "Company saved successfully"})
}

func (h *CompanyHandler) UnsaveCompany(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"saved": false, "message": "Company unsaved successfully"})
}

func (h *CompanyHandler) GetRecommendations(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "4")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 {
		limit = 4
	}

	companies, profiles, err := h.service.GetRecommendations(c.Request.Context(), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var list []gin.H
	for i := range companies {
		list = append(list, gin.H{
			"company": companies[i],
			"profile": profiles[i],
		})
	}

	c.JSON(http.StatusOK, list)
}

func (h *CompanyHandler) SearchCompanies(c *gin.Context) {
	q := c.DefaultQuery("query", "")

	companies, profiles, err := h.service.SearchCompanies(c.Request.Context(), q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var list []gin.H
	for i := range companies {
		list = append(list, gin.H{
			"company": companies[i],
			"profile": profiles[i],
		})
	}

	c.JSON(http.StatusOK, list)
}

func (h *CompanyHandler) RequestVerification(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}

	var payload struct {
		Documents []string `json:"documents" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.service.RequestVerification(c.Request.Context(), userID, companyID, payload.Documents)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Verification request submitted successfully"})
}

func (h *CompanyHandler) UpdateVerificationStatus(c *gin.Context) {
	reqIDStr := c.Param("requestId")
	reqID, err := uuid.Parse(reqIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	var payload struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.service.UpdateVerificationStatus(c.Request.Context(), reqID, payload.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Verification status updated successfully"})
}

// Helpers
func (h *CompanyHandler) getUserID(c *gin.Context) (uuid.UUID, error) {
	val, exists := c.Get("userID")
	if !exists {
		return uuid.MustParse("00000000-0000-0000-0000-000000000001"), nil
	}
	uid, ok := val.(uuid.UUID)
	if !ok {
		return uuid.MustParse("00000000-0000-0000-0000-000000000001"), nil
	}
	return uid, nil
}
