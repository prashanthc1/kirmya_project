package http

import (
	"net/http"
	"kirmya/internal/community/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CommunityHandler struct {
	service *service.CommunityService
}

func NewCommunityHandler(s *service.CommunityService) *CommunityHandler {
	return &CommunityHandler{service: s}
}

type CreateCommPayload struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Category    string `json:"category" binding:"required,oneof=trending industry location"`
	Location    string `json:"location"`
	IsPrivate   bool   `json:"isPrivate"`
}

type ApproveMemberPayload struct {
	CandidateID string `json:"candidateId" binding:"required"`
	Approve     bool   `json:"approve"`
}

type AssignRolePayload struct {
	TargetUserID string `json:"targetUserId" binding:"required"`
	RoleName     string `json:"roleName" binding:"required,oneof=admin moderator member"`
}

type CreatePostPayload struct {
	Content string `json:"content" binding:"required"`
}

type ReportPostPayload struct {
	PostID string `json:"postId" binding:"required"`
	Reason string `json:"reason" binding:"required"`
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

func (h *CommunityHandler) ListCommunities(c *gin.Context) {
	category := c.Query("category")
	location := c.Query("location")

	list, err := h.service.ListCommunities(c.Request.Context(), category, location)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *CommunityHandler) CreateCommunity(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var payload CreateCommPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comm, err := h.service.CreateCommunity(c.Request.Context(), userID, payload.Title, payload.Description, payload.Category, payload.Location, payload.IsPrivate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, comm)
}

func (h *CommunityHandler) JoinCommunity(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commIDStr := c.Param("id")
	commID, err := uuid.Parse(commIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	err = h.service.RequestToJoin(c.Request.Context(), userID, commID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Join request processed"})
}

func (h *CommunityHandler) ApproveMembership(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commIDStr := c.Param("id")
	commID, err := uuid.Parse(commIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	var payload ApproveMemberPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	candID, err := uuid.Parse(payload.CandidateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid candidate ID format"})
		return
	}

	err = h.service.ApproveMembership(c.Request.Context(), userID, commID, candID, payload.Approve)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Membership request status updated"})
}

func (h *CommunityHandler) AssignRole(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commIDStr := c.Param("id")
	commID, err := uuid.Parse(commIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	var payload AssignRolePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	targetUserID, err := uuid.Parse(payload.TargetUserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target user ID format"})
		return
	}

	err = h.service.AssignRole(c.Request.Context(), userID, commID, targetUserID, payload.RoleName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User community role assigned successfully"})
}

func (h *CommunityHandler) CreatePost(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commIDStr := c.Param("id")
	commID, err := uuid.Parse(commIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	var payload CreatePostPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post, err := h.service.CreatePost(c.Request.Context(), userID, commID, payload.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, post)
}

func (h *CommunityHandler) ListPosts(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commIDStr := c.Param("id")
	commID, err := uuid.Parse(commIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	posts, err := h.service.ListPosts(c.Request.Context(), userID, commID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, posts)
}

func (h *CommunityHandler) DeletePost(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commIDStr := c.Param("id")
	commID, err := uuid.Parse(commIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	postIDStr := c.Param("postId")
	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID format"})
		return
	}

	err = h.service.DeletePost(c.Request.Context(), userID, commID, postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post moderated successfully"})
}

func (h *CommunityHandler) ReportPost(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var payload ReportPostPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	postID, err := uuid.Parse(payload.PostID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID format"})
		return
	}

	err = h.service.ReportPost(c.Request.Context(), userID, postID, payload.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post reported successfully"})
}
