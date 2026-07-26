package http

import (
	"net/http"
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Handle is required"})
		return
	}

	company, profile, err := h.service.GetByHandle(c.Request.Context(), handle)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Fetch current follow state if user is logged in (optional check)
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

	companyIDStr := c.Param("id")
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
	})
}

func (h *CompanyHandler) GetRecommendations(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "3")
	limit := 3
	if limitStr == "5" {
		limit = 5
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
		return uuid.Nil, http.ErrNoCookie
	}
	uid, ok := val.(uuid.UUID)
	if !ok {
		return uuid.Nil, http.ErrNoCookie
	}
	return uid, nil
}
