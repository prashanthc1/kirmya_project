package http

import (
	"net/http"
	"strings"

	"kirmya/internal/community/models"
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

// Payloads

type ApproveMemberPayload struct {
	CandidateID string `json:"candidateId" binding:"required"`
	Approve     bool   `json:"approve"`
}

type AssignRolePayload struct {
	TargetUserID string `json:"targetUserId" binding:"required"`
	RoleName     string `json:"roleName" binding:"required,oneof=admin moderator member"`
}

type InviteUserPayload struct {
	InvitedUserID string `json:"invitedUserId" binding:"required"`
}

type RespondInvitePayload struct {
	Accept bool `json:"accept"`
}

type PinPostPayload struct {
	IsPinned bool `json:"isPinned"`
}

type LockPostPayload struct {
	IsLocked bool `json:"isLocked"`
}

type ReportPostPayload struct {
	PostID string `json:"postId" binding:"required"`
	Reason string `json:"reason" binding:"required"`
}

// Handlers

func (h *CommunityHandler) ListCommunities(c *gin.Context) {
	var params models.CommunityFilterParams
	params.Category = c.Query("category")
	params.Location = c.Query("location")
	params.Visibility = c.Query("visibility")
	params.Topic = c.Query("topic")
	params.Skill = c.Query("skill")
	params.SearchQuery = c.Query("query")

	if params.SearchQuery != "" {
		list, err := h.service.SearchCommunities(c.Request.Context(), params.SearchQuery, params)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, list)
		return
	}

	list, err := h.service.ListCommunities(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *CommunityHandler) GetRecommendedCommunities(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	skillsParam := c.Query("skills")
	var userSkills []string
	if skillsParam != "" {
		userSkills = strings.Split(skillsParam, ",")
	}
	userIndustry := c.Query("industry")

	list, err := h.service.GetRecommendedCommunities(c.Request.Context(), userID, userSkills, userIndustry)
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

	var dto models.CreateCommunityDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comm, err := h.service.CreateCommunity(c.Request.Context(), userID, dto)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, comm)
}

func (h *CommunityHandler) GetCommunity(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	comm, err := h.service.GetCommunity(c.Request.Context(), userID, commID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, comm)
}

func (h *CommunityHandler) UpdateCommunity(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	var dto models.UpdateCommunityDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comm, err := h.service.UpdateCommunity(c.Request.Context(), userID, commID, dto)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, comm)
}

func (h *CommunityHandler) JoinCommunity(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	err = h.service.RequestToJoin(c.Request.Context(), userID, commID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Join request processed"})
}

func (h *CommunityHandler) LeaveCommunity(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	err = h.service.LeaveCommunity(c.Request.Context(), userID, commID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Left community workspace"})
}

func (h *CommunityHandler) ListMembers(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	members, err := h.service.ListMembers(c.Request.Context(), userID, commID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, members)
}

func (h *CommunityHandler) ApproveMembership(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Membership request status updated"})
}

func (h *CommunityHandler) AssignRole(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User community role assigned successfully"})
}

func (h *CommunityHandler) ListPendingRequests(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	requests, err := h.service.ListPendingRequests(c.Request.Context(), userID, commID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, requests)
}

func (h *CommunityHandler) InviteUser(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	var payload InviteUserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	invitedUserID, err := uuid.Parse(payload.InvitedUserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invited user ID format"})
		return
	}

	inv, err := h.service.InviteUser(c.Request.Context(), userID, commID, invitedUserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, inv)
}

func (h *CommunityHandler) RespondToInvite(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	inviteID, err := uuid.Parse(c.Param("inviteId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invite ID format"})
		return
	}

	var payload RespondInvitePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.service.RespondToInvite(c.Request.Context(), userID, inviteID, payload.Accept)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invitation response recorded"})
}

// Discussions & Posts

func (h *CommunityHandler) CreatePost(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	var dto models.CreateDiscussionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post, err := h.service.CreatePost(c.Request.Context(), userID, commID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, post)
}

func (h *CommunityHandler) ListPosts(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	posts, err := h.service.ListPosts(c.Request.Context(), userID, commID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, posts)
}

func (h *CommunityHandler) GetPost(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	postID, err := uuid.Parse(c.Param("postId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID format"})
		return
	}

	post, err := h.service.GetPost(c.Request.Context(), userID, commID, postID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, post)
}

func (h *CommunityHandler) DeletePost(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	postID, err := uuid.Parse(c.Param("postId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID format"})
		return
	}

	err = h.service.DeletePost(c.Request.Context(), userID, commID, postID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post moderated successfully"})
}

func (h *CommunityHandler) PinPost(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	postID, err := uuid.Parse(c.Param("postId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID format"})
		return
	}

	var payload PinPostPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.service.PinPost(c.Request.Context(), userID, commID, postID, payload.IsPinned)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post pin state updated"})
}

func (h *CommunityHandler) LockPost(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	postID, err := uuid.Parse(c.Param("postId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID format"})
		return
	}

	var payload LockPostPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.service.LockPost(c.Request.Context(), userID, commID, postID, payload.IsLocked)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post lock state updated"})
}

// Comments

func (h *CommunityHandler) CreateComment(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	postID, err := uuid.Parse(c.Param("postId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID format"})
		return
	}

	var dto models.CreateCommentDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comment, err := h.service.CreateComment(c.Request.Context(), userID, commID, postID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, comment)
}

func (h *CommunityHandler) ListComments(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	postID, err := uuid.Parse(c.Param("postId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID format"})
		return
	}

	comments, err := h.service.ListComments(c.Request.Context(), userID, commID, postID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, comments)
}

// Events

func (h *CommunityHandler) CreateEvent(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	var dto models.CreateCommunityEventDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event, err := h.service.CreateEvent(c.Request.Context(), userID, commID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, event)
}

func (h *CommunityHandler) ListEvents(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	events, err := h.service.ListEvents(c.Request.Context(), userID, commID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

// Resources

func (h *CommunityHandler) CreateResource(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	var dto models.CreateCommunityResourceDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resource, err := h.service.CreateResource(c.Request.Context(), userID, commID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resource)
}

func (h *CommunityHandler) ListResources(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	resources, err := h.service.ListResources(c.Request.Context(), userID, commID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resources)
}

// Moderation & Reports

func (h *CommunityHandler) ModerateMember(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	var dto models.ModerateMemberDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.service.ModerateMember(c.Request.Context(), userID, commID, dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Moderation action recorded"})
}

func (h *CommunityHandler) ListModerationActions(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	actions, err := h.service.ListModerationActions(c.Request.Context(), userID, commID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, actions)
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post reported successfully"})
}

func (h *CommunityHandler) ListReports(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	commID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid community ID format"})
		return
	}

	reports, err := h.service.ListReports(c.Request.Context(), userID, commID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}
