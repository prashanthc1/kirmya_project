package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/trust_safety/models"
	"kirmya/internal/trust_safety/service"
)

type TrustSafetyHandler struct {
	safetyService service.TrustSafetyService
}

func NewTrustSafetyHandler(safetyService service.TrustSafetyService) *TrustSafetyHandler {
	return &TrustSafetyHandler{safetyService: safetyService}
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

func (h *TrustSafetyHandler) SubmitReport(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var body models.ReportSubmitPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	targetUUID, err := uuid.Parse(body.TargetID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target_id format"})
		return
	}

	report, err := h.safetyService.SubmitReport(c.Request.Context(), userID, body.TargetType, targetUUID, body.TargetTitle, body.Category, body.Description, body.EvidenceURLs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": report})
}

func (h *TrustSafetyHandler) GetUserReports(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	reports, err := h.safetyService.GetUserReports(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": reports})
}

func (h *TrustSafetyHandler) GetReportByID(c *gin.Context) {
	_, ok := getUserID(c)
	if !ok {
		return
	}

	reportID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report ID"})
		return
	}

	report, err := h.safetyService.GetReportByID(c.Request.Context(), reportID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Report not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": report})
}

func (h *TrustSafetyHandler) BlockUser(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var body models.BlockUserPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		// Fallback to URL path param if body empty
		blockedIDStr := c.Param("userId")
		if blockedIDStr != "" {
			body.BlockedID = blockedIDStr
			body.BlockedType = "user"
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	blockedUUID, err := uuid.Parse(body.BlockedID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blocked_id format"})
		return
	}

	if body.BlockedType == "" {
		body.BlockedType = "user"
	}

	err = h.safetyService.BlockUser(c.Request.Context(), userID, body.BlockedType, blockedUUID, body.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Blocked successfully."})
}

func (h *TrustSafetyHandler) UnblockUser(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	blockedIDStr := c.Param("userId")
	blockedUUID, err := uuid.Parse(blockedIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid userId format"})
		return
	}

	err = h.safetyService.UnblockUser(c.Request.Context(), userID, blockedUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Unblocked successfully."})
}

func (h *TrustSafetyHandler) GetUserBlocks(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	blocks, err := h.safetyService.GetUserBlocks(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": blocks})
}

func (h *TrustSafetyHandler) MuteEntity(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var body models.MuteUserPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mutedUUID, err := uuid.Parse(body.MutedID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid muted_id format"})
		return
	}

	err = h.safetyService.MuteEntity(c.Request.Context(), userID, body.MutedType, mutedUUID, body.DurationDays)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Muted successfully."})
}

func (h *TrustSafetyHandler) UnmuteEntity(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	mutedUUID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id format"})
		return
	}

	err = h.safetyService.UnmuteEntity(c.Request.Context(), userID, mutedUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Unmuted successfully."})
}

func (h *TrustSafetyHandler) GetUserMutes(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	mutes, err := h.safetyService.GetUserMutes(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": mutes})
}

func (h *TrustSafetyHandler) SubmitAppeal(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var body models.AppealSubmitPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	decisionUUID, err := uuid.Parse(body.DecisionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid decision_id format"})
		return
	}

	appeal, err := h.safetyService.SubmitAppeal(c.Request.Context(), decisionUUID, userID, body.Reason, body.Explanation, body.EvidenceURLs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": appeal})
}

func (h *TrustSafetyHandler) GetUserAppeals(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	appeals, err := h.safetyService.GetUserAppeals(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": appeals})
}

func (h *TrustSafetyHandler) GetAppealByID(c *gin.Context) {
	_, ok := getUserID(c)
	if !ok {
		return
	}

	appealID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appeal ID"})
		return
	}

	appeal, err := h.safetyService.GetAppealByID(c.Request.Context(), appealID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appeal not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": appeal})
}

func (h *TrustSafetyHandler) GetUserRestrictions(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	restrictions, err := h.safetyService.GetUserActiveRestrictions(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": restrictions})
}
