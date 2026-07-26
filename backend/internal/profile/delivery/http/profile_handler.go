package http

import (
	"net/http"
	"time"

	"kirmya/internal/profile/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProfileHandler struct {
	service *service.ProfileService
}

func NewProfileHandler(s *service.ProfileService) *ProfileHandler {
	return &ProfileHandler{service: s}
}

// Request DTOs
type UpdateProfileRequest struct {
	Headline           string `json:"headline"`
	Summary            string `json:"summary"`
	AvailabilityStatus string `json:"availabilityStatus" binding:"required,oneof=open_to_work available_for_freelance looking_for_networking hiring"`
	Volunteering       string `json:"volunteering"`
	Publications       string `json:"publications"`
	Licenses           string `json:"licenses"`
}

type AddSkillRequest struct {
	Name             string `json:"name" binding:"required"`
	ProficiencyLevel string `json:"proficiencyLevel" binding:"required,oneof=Beginner Intermediate Expert"`
}

type AddCertRequest struct {
	Name                string `json:"name" binding:"required"`
	IssuingOrganization string `json:"issuingOrganization" binding:"required"`
	IssueDate           string `json:"issueDate"`      // YYYY-MM-DD
	ExpirationDate      string `json:"expirationDate"` // YYYY-MM-DD
	CredentialID        string `json:"credentialId"`
	CredentialURL       string `json:"credentialUrl"`
}

type AddProjectRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	URL         string `json:"url"`
	StartDate   string `json:"startDate"` // YYYY-MM-DD
	EndDate     string `json:"endDate"`   // YYYY-MM-DD
}

type AddLangRequest struct {
	Name        string `json:"name" binding:"required"`
	Proficiency string `json:"proficiency" binding:"required"`
}

type AddAchievementRequest struct {
	Title        string `json:"title" binding:"required"`
	Description  string `json:"description"`
	DateAchieved string `json:"dateAchieved"` // YYYY-MM-DD
}

type UpdatePrefRequest struct {
	ProfileVisibility string `json:"profileVisibility" binding:"required,oneof=public connections_only private"`
}

func getUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized context"})
		return uuid.Nil, false
	}
	userID, ok := val.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid context type"})
		return uuid.Nil, false
	}
	return userID, true
}

func parseDate(dateStr string) *time.Time {
	if dateStr == "" {
		return nil
	}
	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil
	}
	return &t
}

// REST Endpoints
func (h *ProfileHandler) GetMyProfile(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	p, err := h.service.GetOrCreateProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProfileHandler) GetPublicProfile(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

	p, err := h.service.GetOrCreateProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Retrieve preferences to assert visibility permissions
	pref, err := h.service.GetOrCreatePreferences(c.Request.Context(), userID)
	if err == nil && pref != nil && pref.ProfileVisibility == "private" {
		c.JSON(http.StatusForbidden, gin.H{"error": "This profile is private"})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p, err := h.service.UpdateProfile(c.Request.Context(), userID, req.Headline, req.Summary, req.AvailabilityStatus, req.Volunteering, req.Publications, req.Licenses)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProfileHandler) AddSkill(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req AddSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	skills, err := h.service.AddSkill(c.Request.Context(), userID, req.Name, req.ProficiencyLevel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, skills)
}

func (h *ProfileHandler) DeleteSkill(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid skill ID format"})
		return
	}

	if err := h.service.DeleteSkill(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Skill deleted successfully"})
}

func (h *ProfileHandler) AddCertification(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req AddCertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	issueDate := parseDate(req.IssueDate)
	expDate := parseDate(req.ExpirationDate)

	certs, err := h.service.AddCertification(c.Request.Context(), userID, req.Name, req.IssuingOrganization, issueDate, expDate, req.CredentialID, req.CredentialURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, certs)
}

func (h *ProfileHandler) DeleteCertification(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid certification ID"})
		return
	}

	if err := h.service.DeleteCertification(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Certification deleted"})
}

func (h *ProfileHandler) AddProject(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req AddProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	startDate := parseDate(req.StartDate)
	endDate := parseDate(req.EndDate)

	projects, err := h.service.AddProject(c.Request.Context(), userID, req.Title, req.Description, req.URL, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, projects)
}

func (h *ProfileHandler) DeleteProject(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	if err := h.service.DeleteProject(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project deleted"})
}

func (h *ProfileHandler) AddLanguage(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req AddLangRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	langs, err := h.service.AddLanguage(c.Request.Context(), userID, req.Name, req.Proficiency)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, langs)
}

func (h *ProfileHandler) DeleteLanguage(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid language ID"})
		return
	}

	if err := h.service.DeleteLanguage(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Language deleted"})
}

func (h *ProfileHandler) AddAchievement(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req AddAchievementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dateAchieved := parseDate(req.DateAchieved)

	achs, err := h.service.AddAchievement(c.Request.Context(), userID, req.Title, req.Description, dateAchieved)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, achs)
}

func (h *ProfileHandler) DeleteAchievement(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid achievement ID"})
		return
	}

	if err := h.service.DeleteAchievement(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Achievement deleted"})
}

func (h *ProfileHandler) GetMyPreferences(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	pref, err := h.service.GetOrCreatePreferences(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, pref)
}

func (h *ProfileHandler) UpdatePreferences(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req UpdatePrefRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pref, err := h.service.UpdatePreferences(c.Request.Context(), userID, req.ProfileVisibility)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, pref)
}
