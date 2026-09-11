package http

import (
	"context"
	"errors"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	mediaDomain "kirmya/internal/media/domain"
	"kirmya/internal/profile/models"
	"kirmya/internal/profile/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ImageStore persists profile imagery and reports the URL it can be fetched
// from.
//
// A narrow interface over the media file service, so the profile module depends
// on "store this image and tell me where it lives" rather than on the media
// module's repository, storage provider and handlers. *media/service.
// DefaultFileService satisfies it.
type ImageStore interface {
	UploadFile(
		ctx context.Context,
		ownerID uuid.UUID,
		header *multipart.FileHeader,
		category, visibility string,
		metadata map[string]interface{},
	) (*mediaDomain.FileRecord, error)
}

type ProfileHandler struct {
	service *service.ProfileService
	// images is where an uploaded avatar or cover actually goes.
	//
	// Before it existed, UploadPhoto validated the file, composed a URL from the
	// user id, saved that string, and dropped the bytes on the floor. The
	// response said "Profile photo updated successfully" and the avatar was
	// never anywhere.
	images ImageStore
}

func NewProfileHandler(s *service.ProfileService) *ProfileHandler {
	return &ProfileHandler{service: s}
}

// WithImageStore wires the store that avatar and cover uploads are written to.
//
// Separate from the constructor because the file service is assembled later in
// startup than the profile handler. A handler without one does not fall back to
// inventing a URL: the upload routes refuse, because answering "saved" for an
// image that was not saved is the whole of the defect this removes.
func (h *ProfileHandler) WithImageStore(store ImageStore) *ProfileHandler {
	h.images = store
	return h
}

// storeProfileImage persists one uploaded image and returns its fetchable URL.
func (h *ProfileHandler) storeProfileImage(c *gin.Context, userID uuid.UUID, file *multipart.FileHeader, category string) (string, bool) {
	if h.images == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Profile image storage is not configured",
			"code":  "IMAGE_STORAGE_UNAVAILABLE",
		})
		return "", false
	}

	// Visibility is left to the media service, which makes avatars and covers
	// public because they are rendered on a page other people look at.
	record, err := h.images.UploadFile(c.Request.Context(), userID, file, category, "", map[string]interface{}{
		"source": "profile",
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not store the uploaded image"})
		return "", false
	}
	url := strings.TrimSpace(record.URL)
	if url == "" {
		// A stored file with no address is not a stored file, as far as anything
		// that has to render it is concerned. Trimmed first: a URL of one space
		// is as unrenderable as an empty one, and passing it on would put a
		// broken <img src> on the page rather than an honest failure here.
		c.JSON(http.StatusInternalServerError, gin.H{"error": "The uploaded image was stored without a retrievable address"})
		return "", false
	}
	return url, true
}

func getUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized context"})
		return uuid.Nil, false
	}
	switch uid := val.(type) {
	case uuid.UUID:
		if uid == uuid.Nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user identity"})
			return uuid.Nil, false
		}
		return uid, true
	case string:
		if parsed, err := uuid.Parse(uid); err == nil && parsed != uuid.Nil {
			return parsed, true
		}
	}
	c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized user context"})
	return uuid.Nil, false
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

// User Endpoints
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

func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.UpdateProfileDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p, err := h.service.UpdateProfile(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProfileHandler) UpdateAbout(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}
	var req struct {
		Summary string `json:"summary"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p, err := h.service.UpdateProfileAbout(c.Request.Context(), userID, req.Summary)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProfileHandler) UpdateHeadline(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}
	var req struct {
		Headline string `json:"headline"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p, err := h.service.UpdateProfileHeadline(c.Request.Context(), userID, req.Headline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProfileHandler) GetPublicProfile(c *gin.Context) {
	param := c.Param("username")
	if param == "" {
		param = c.Param("userId")
	}

	if uid, err := uuid.Parse(param); err == nil {
		p, err := h.service.GetPublicProfileByUserID(c.Request.Context(), uid)
		if err != nil || p == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
			return
		}
		c.JSON(http.StatusOK, p)
		return
	}

	p, err := h.service.GetProfileByUsername(c.Request.Context(), param)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProfileHandler) GetProfilePreview(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}
	p, err := h.service.GetOrCreateProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	viewMode := c.DefaultQuery("view", "public")
	if viewMode == "public" {
		p.Volunteering = ""
		p.Licenses = ""
		p.Publications = ""
	}

	c.JSON(http.StatusOK, gin.H{"viewMode": viewMode, "profile": p})
}

// Work Experience
func (h *ProfileHandler) AddWorkExperience(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.WorkExperienceDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	list, err := h.service.AddWorkExperience(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, list)
}

func (h *ProfileHandler) UpdateWorkExperience(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	expID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid work experience ID"})
		return
	}

	var req models.WorkExperienceDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	list, err := h.service.UpdateWorkExperience(c.Request.Context(), userID, expID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *ProfileHandler) DeleteWorkExperience(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	expID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid work experience ID"})
		return
	}

	if err := h.service.DeleteWorkExperience(c.Request.Context(), userID, expID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Work experience deleted successfully"})
}

// Education
func (h *ProfileHandler) AddEducation(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.EducationDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	list, err := h.service.AddEducation(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, list)
}

func (h *ProfileHandler) UpdateEducation(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	eduID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid education ID"})
		return
	}

	var req models.EducationDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	list, err := h.service.UpdateEducation(c.Request.Context(), userID, eduID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *ProfileHandler) DeleteEducation(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	eduID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid education ID"})
		return
	}

	if err := h.service.DeleteEducation(c.Request.Context(), userID, eduID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Education deleted successfully"})
}

// Skills
func (h *ProfileHandler) AddSkill(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req struct {
		Name             string `json:"name" binding:"required"`
		ProficiencyLevel string `json:"proficiencyLevel"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ProficiencyLevel == "" {
		req.ProficiencyLevel = "Intermediate"
	}

	skills, err := h.service.AddSkill(c.Request.Context(), userID, req.Name, req.ProficiencyLevel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, skills)
}

func (h *ProfileHandler) DeleteSkill(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	skillID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid skill ID"})
		return
	}

	if err := h.service.DeleteSkill(c.Request.Context(), userID, skillID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Skill deleted successfully"})
}

// Certifications
func (h *ProfileHandler) AddCertification(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req struct {
		Name                string `json:"name" binding:"required"`
		IssuingOrganization string `json:"issuingOrganization" binding:"required"`
		IssueDate           string `json:"issueDate"`
		ExpirationDate      string `json:"expirationDate"`
		CredentialID        string `json:"credentialId"`
		CredentialURL       string `json:"credentialUrl"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	certs, err := h.service.AddCertification(c.Request.Context(), userID, req.Name, req.IssuingOrganization, parseDate(req.IssueDate), parseDate(req.ExpirationDate), req.CredentialID, req.CredentialURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, certs)
}

func (h *ProfileHandler) DeleteCertification(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	certID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid certification ID"})
		return
	}

	if err := h.service.DeleteCertification(c.Request.Context(), userID, certID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Certification deleted successfully"})
}

// Projects
func (h *ProfileHandler) AddProject(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		URL         string `json:"url"`
		StartDate   string `json:"startDate"`
		EndDate     string `json:"endDate"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	projects, err := h.service.AddProject(c.Request.Context(), userID, req.Title, req.Description, req.URL, parseDate(req.StartDate), parseDate(req.EndDate))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, projects)
}

func (h *ProfileHandler) DeleteProject(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	projID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	if err := h.service.DeleteProject(c.Request.Context(), userID, projID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
}

// Languages
func (h *ProfileHandler) AddLanguage(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req struct {
		Name        string `json:"name" binding:"required"`
		Proficiency string `json:"proficiency" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	langs, err := h.service.AddLanguage(c.Request.Context(), userID, req.Name, req.Proficiency)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, langs)
}

func (h *ProfileHandler) DeleteLanguage(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	langID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid language ID"})
		return
	}

	if err := h.service.DeleteLanguage(c.Request.Context(), userID, langID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Language deleted successfully"})
}

// Achievements
func (h *ProfileHandler) AddAchievement(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req struct {
		Title        string `json:"title" binding:"required"`
		Description  string `json:"description"`
		DateAchieved string `json:"dateAchieved"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	achs, err := h.service.AddAchievement(c.Request.Context(), userID, req.Title, req.Description, parseDate(req.DateAchieved))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, achs)
}

func (h *ProfileHandler) DeleteAchievement(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	achID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid achievement ID"})
		return
	}

	if err := h.service.DeleteAchievement(c.Request.Context(), userID, achID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Achievement deleted successfully"})
}

func validateImageUpload(file *multipart.FileHeader) error {
	if file.Size > 5*1024*1024 {
		return errors.New("file size exceeds 5MB limit")
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		return errors.New("allowed formats: JPG, PNG, WEBP")
	}

	src, err := file.Open()
	if err != nil {
		return errors.New("failed to read uploaded file")
	}
	defer src.Close()

	buf := make([]byte, 512)
	n, _ := src.Read(buf)
	mimeType := http.DetectContentType(buf[:n])
	if !strings.HasPrefix(mimeType, "image/") {
		return errors.New("invalid file format: uploaded content is not an image")
	}

	return nil
}

// Media Upload
func (h *ProfileHandler) UploadPhoto(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	file, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Photo file is required"})
		return
	}

	if err := validateImageUpload(file); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	photoURL, ok := h.storeProfileImage(c, userID, file, mediaDomain.CategoryAvatar)
	if !ok {
		return
	}
	if err := h.service.UpdatePhoto(c.Request.Context(), userID, photoURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not attach the uploaded image to this profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile photo updated successfully", "photo_url": photoURL})
}

func (h *ProfileHandler) DeletePhoto(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}
	if err := h.service.UpdatePhoto(c.Request.Context(), userID, ""); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Profile photo removed"})
}

func (h *ProfileHandler) UploadCover(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	file, err := c.FormFile("cover")
	if err != nil {
		file, err = c.FormFile("photo")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cover photo file is required"})
			return
		}
	}

	if err := validateImageUpload(file); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	coverURL, ok := h.storeProfileImage(c, userID, file, mediaDomain.CategoryCover)
	if !ok {
		return
	}
	if err := h.service.UpdateCover(c.Request.Context(), userID, coverURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not attach the uploaded image to this profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cover photo updated successfully", "cover_url": coverURL})
}

func (h *ProfileHandler) DeleteCover(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}
	if err := h.service.UpdateCover(c.Request.Context(), userID, ""); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cover photo removed"})
}

func (h *ProfileHandler) GetVerificationStatus(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}
	p, err := h.service.GetOrCreateProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status": p.VerificationStatus,
		"notes":  p.VerificationNotes,
	})
}

// Preferences & Privacy
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

	var req struct {
		ProfileVisibility string `json:"profileVisibility" binding:"required"`
	}
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

// Report
func (h *ProfileHandler) ReportProfile(c *gin.Context) {
	reporterID, ok := getUserID(c)
	if !ok {
		return
	}

	param := c.Param("username")
	p, err := h.service.GetProfileByUsername(c.Request.Context(), param)
	if err != nil || p == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target profile not found"})
		return
	}

	var req models.ProfileReportDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ReportProfile(c.Request.Context(), reporterID, p.UserID, req.Reason, req.Description); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile report submitted to Trust & Safety team."})
}

// Admin Endpoints
func (h *ProfileHandler) AdminGetProfile(c *gin.Context) {
	uidStr := c.Param("id")
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	p, err := h.service.GetOrCreateProfile(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *ProfileHandler) AdminUpdateProfile(c *gin.Context) {
	uidStr := c.Param("id")
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.UpdateProfileDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p, err := h.service.UpdateProfile(c.Request.Context(), uid, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProfileHandler) AdminVerifyProfile(c *gin.Context) {
	uidStr := c.Param("id")
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.AdminVerificationDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.AdminVerifyProfile(c.Request.Context(), uid, req.Status, req.Notes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile verification updated by Admin"})
}

func (h *ProfileHandler) AdminRestrictProfile(c *gin.Context) {
	uidStr := c.Param("id")
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.AdminRestrictionDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.AdminRestrictProfile(c.Request.Context(), uid, req.IsRestricted); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile restriction state updated by Admin"})
}

func (h *ProfileHandler) GetCompleteness(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	dto, err := h.service.CalculateCompleteness(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto)
}

func (h *ProfileHandler) RequestVerification(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.VerificationRequestPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p, err := h.service.RequestVerification(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProfileHandler) UpdateCareerPreferences(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req models.CareerPreferencesDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p, err := h.service.UpdateCareerPreferences(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProfileHandler) GetResumeConsistency(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	dto, err := h.service.CheckResumeConsistency(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto)
}

func (h *ProfileHandler) GetAnalytics(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	dto, err := h.service.GetAnalytics(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto)
}

// File helper type for multipart header
var _ = (*multipart.FileHeader)(nil)
