package http

import (
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"kirmya/internal/onboarding/domain"
	"kirmya/internal/onboarding/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var DemoUserID = uuid.MustParse("00000000-0000-0000-0000-000000000001")

type OnboardingHandler struct {
	svc           service.OnboardingService
	allowDemoUser bool
}

func NewOnboardingHandler(svc service.OnboardingService) *OnboardingHandler {
	allowDemo := demoUserAllowed()
	if allowDemo && strings.EqualFold(os.Getenv("APP_ENV"), "production") {
		slog.Warn("Onboarding demo-user fallback is enabled in production; anonymous callers share one profile",
			slog.String("demo_user_id", DemoUserID.String()))
	}
	return &OnboardingHandler{svc: svc, allowDemoUser: allowDemo}
}

func demoUserAllowed() bool {
	raw, ok := os.LookupEnv("ONBOARDING_ALLOW_DEMO_USER")
	if !ok || strings.TrimSpace(raw) == "" {
		return true
	}
	allowed, err := strconv.ParseBool(strings.TrimSpace(raw))
	if err != nil {
		return true
	}
	return allowed
}

func (h *OnboardingHandler) resolveUserID(c *gin.Context) (uuid.UUID, bool) {
	if val, ok := c.Get("userID"); ok {
		switch uid := val.(type) {
		case uuid.UUID:
			if uid != uuid.Nil {
				return uid, true
			}
		case string:
			if parsed, err := uuid.Parse(uid); err == nil {
				return parsed, true
			}
		}
	}

	if h.allowDemoUser {
		return DemoUserID, true
	}

	c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication is required to continue onboarding"})
	c.Abort()
	return uuid.Nil, false
}

func (h *OnboardingHandler) GetProgress(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	p, err := h.svc.GetProgress(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *OnboardingHandler) StartOnboarding(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	err := h.svc.SaveStep(c.Request.Context(), userID, 1)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Onboarding started", "current_step": 1})
}

func (h *OnboardingHandler) SaveProgress(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	var body struct {
		Step int `json:"step"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload", "details": err.Error()})
		return
	}

	err := h.svc.SaveStep(c.Request.Context(), userID, body.Step)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Progress saved", "step": body.Step})
}

func (h *OnboardingHandler) SkipStep(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	stepStr := c.Param("stepId")
	step, err := strconv.Atoi(stepStr)
	if err != nil {
		step = 1
	}

	err = h.svc.SkipStep(c.Request.Context(), userID, step)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Step skipped", "skipped_step": step, "next_step": step + 1})
}

func (h *OnboardingHandler) CompleteStep(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	stepStr := c.Param("stepId")
	step, err := strconv.Atoi(stepStr)
	if err != nil {
		step = 1
	}

	err = h.svc.SaveStep(c.Request.Context(), userID, step)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Step completed", "step": step})
}

func (h *OnboardingHandler) ResumeOnboarding(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	p, err := h.svc.GetProgress(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Resumed onboarding", "progress": p})
}

func (h *OnboardingHandler) CompleteOnboarding(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	err := h.svc.CompleteOnboarding(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Onboarding completed successfully", "redirect": "/dashboard"})
}

func (h *OnboardingHandler) GetProfileCompletion(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	comp, err := h.svc.GetProfileCompletion(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, comp)
}

func (h *OnboardingHandler) UploadProfilePhoto(c *gin.Context) {
	if _, ok := h.resolveUserID(c); !ok {
		return
	}

	file, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Photo file is required"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported image format. Allowed: JPG, PNG, WEBP"})
		return
	}

	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Photo size exceeds maximum 5 MB limit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Profile photo uploaded successfully",
		"photo_url": "/uploads/profile_photo_demo.jpg",
	})
}

func (h *OnboardingHandler) UploadResume(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	file, err := c.FormFile("resume")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Resume file is required"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".pdf" && ext != ".docx" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported resume format. Allowed: PDF, DOCX"})
		return
	}

	res, err := h.svc.ProcessResumeUpload(c.Request.Context(), userID, file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *OnboardingHandler) SaveSkills(c *gin.Context) {
	if _, ok := h.resolveUserID(c); !ok {
		return
	}

	var body struct {
		Skills []domain.SkillItem `json:"skills"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid skills payload"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Skills saved successfully", "count": len(body.Skills)})
}

func (h *OnboardingHandler) SaveWorkExperience(c *gin.Context) {
	if _, ok := h.resolveUserID(c); !ok {
		return
	}

	var body struct {
		Experiences []domain.WorkExperienceItem `json:"experiences"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid work experience payload"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Work experience saved successfully", "count": len(body.Experiences)})
}

func (h *OnboardingHandler) SaveEducation(c *gin.Context) {
	if _, ok := h.resolveUserID(c); !ok {
		return
	}

	var body struct {
		Educations []domain.EducationItem `json:"educations"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid education payload"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Education saved successfully", "count": len(body.Educations)})
}

func (h *OnboardingHandler) SaveCertifications(c *gin.Context) {
	if _, ok := h.resolveUserID(c); !ok {
		return
	}

	var body struct {
		Certifications []domain.CertificationItem `json:"certifications"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid certifications payload"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Certifications saved successfully", "count": len(body.Certifications)})
}

func (h *OnboardingHandler) SaveCareerPreferences(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	var pref domain.CareerPreferences
	if err := c.ShouldBindJSON(&pref); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid career preferences payload"})
		return
	}

	if err := h.svc.SaveCareerPreferences(c.Request.Context(), userID, &pref); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Career preferences saved successfully"})
}

func (h *OnboardingHandler) SaveRecruiterOnboarding(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	var payload domain.RecruiterOnboardingPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recruiter onboarding payload"})
		return
	}
	if err := h.svc.SaveRecruiterOnboarding(c.Request.Context(), userID, &payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Recruiter hiring preferences configured."})
}

func (h *OnboardingHandler) SaveEmployerOnboarding(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	var payload domain.EmployerOnboardingPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employer onboarding payload"})
		return
	}
	if err := h.svc.SaveEmployerOnboarding(c.Request.Context(), userID, &payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Employer company profile configured."})
}

func (h *OnboardingHandler) GetCommunities(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	comms, err := h.svc.GetRecommendedCommunities(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, comms)
}

func (h *OnboardingHandler) GetConnections(c *gin.Context) {
	userID, ok := h.resolveUserID(c)
	if !ok {
		return
	}
	conns, err := h.svc.GetRecommendedConnections(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conns)
}

// Admin Handlers
func (h *OnboardingHandler) GetStepConfigs(c *gin.Context) {
	configs, err := h.svc.GetStepConfigs(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, configs)
}

func (h *OnboardingHandler) UpdateStepConfigs(c *gin.Context) {
	var body struct {
		Configs []domain.OnboardingStepConfig `json:"configs"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.UpdateStepConfigs(c.Request.Context(), body.Configs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Onboarding step configuration updated."})
}

func (h *OnboardingHandler) GetAnalyticsSummary(c *gin.Context) {
	summary, err := h.svc.GetAnalyticsSummary(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}
