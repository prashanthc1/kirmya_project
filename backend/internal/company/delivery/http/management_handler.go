package http

import (
	"net/http"
	"strings"
	"time"

	"kirmya/internal/company/models"
	"kirmya/internal/company/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ManagementHandler serves the company and organization management API.
//
// Handlers here do parsing and shaping only. Every authorization decision is
// made by the service against the caller's grant on the company named in the
// path, so no route can be made more permissive by editing this file.
type ManagementHandler struct {
	service *service.ManagementService
}

// NewManagementHandler wires the handler.
func NewManagementHandler(s *service.ManagementService) *ManagementHandler {
	return &ManagementHandler{service: s}
}

// resolveCompany turns the :id path segment into a company id. The segment is
// a uuid or a slug, because /company/{slug} and /companies/{id} are the same
// resource seen from the public page and from the dashboard.
func (h *ManagementHandler) resolveCompany(c *gin.Context) (uuid.UUID, bool) {
	raw := strings.TrimSpace(c.Param("id"))
	if raw == "" {
		raw = strings.TrimSpace(c.Param("slug"))
	}
	if raw == "" {
		raw = strings.TrimSpace(c.Query("companyId"))
	}
	if raw == "" {
		raw = strings.TrimSpace(c.Query("company_id"))
	}
	if raw == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company is required"})
		return uuid.Nil, false
	}
	if id, err := uuid.Parse(raw); err == nil {
		return id, true
	}

	id, err := h.service.CompanyIDBySlug(c.Request.Context(), raw)
	if err != nil {
		respondError(c, err)
		return uuid.Nil, false
	}
	return id, true
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

// CreateCompany handles POST /api/v1/companies.
func (h *ManagementHandler) CreateCompany(c *gin.Context) {
	var payload models.CompanyCreatePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	detail, err := h.service.CreateCompany(c.Request.Context(), actorFrom(c), payload)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, detail)
}

// GetCompany handles GET /api/v1/companies/:id, where :id is an id or a slug.
func (h *ManagementHandler) GetCompany(c *gin.Context) {
	companyID, ok := h.resolveCompany(c)
	if !ok {
		return
	}
	actor := actorFrom(c)

	detail, err := h.service.GetCompany(c.Request.Context(), actor, companyID)
	if err != nil {
		respondError(c, err)
		return
	}

	// The view is recorded after the page is known to be visible, so a probe
	// that got a 404 does not show up in the company's analytics.
	h.service.RecordProfileView(c.Request.Context(), actor, companyID,
		c.ClientIP()+"|"+c.Request.UserAgent(), c.Query("source"))

	c.JSON(http.StatusOK, detail)
}

// UpdateCompany handles PUT /api/v1/companies/:id.
func (h *ManagementHandler) UpdateCompany(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	var payload models.CompanyUpdatePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	detail, err := h.service.UpdateCompany(c.Request.Context(), actorFrom(c), companyID, payload)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, detail)
}

// ---------------------------------------------------------------------------
// Search and discovery
// ---------------------------------------------------------------------------

// SearchCompanies handles GET /api/v1/companies/search.
func (h *ManagementHandler) SearchCompanies(c *gin.Context) {
	var query models.CompanySearchQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if raw := c.Query("skills"); raw != "" && len(query.Skills) == 0 {
		query.Skills = strings.Split(raw, ",")
	}

	page, err := h.service.SearchCompanies(c.Request.Context(), actorFrom(c), query)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, page)
}

// Discovery handles GET /api/v1/companies/discovery.
func (h *ManagementHandler) Discovery(c *gin.Context) {
	_, limit := pagination(c, 8)

	shelves, err := h.service.Discovery(c.Request.Context(), actorFrom(c), limit)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, shelves)
}

// ListFollowing handles GET /api/v1/companies/following.
func (h *ManagementHandler) ListFollowing(c *gin.Context) {
	page, limit := pagination(c, 20)

	result, err := h.service.ListFollowing(c.Request.Context(), actorFrom(c), page, limit)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

// ListMyCompanies handles GET /api/v1/companies/mine. It answers the dashboard's
// first question: which companies may this caller manage, and with what.
func (h *ManagementHandler) ListMyCompanies(c *gin.Context) {
	memberships, err := h.service.ListMyCompanies(c.Request.Context(), actorFrom(c))
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, memberships)
}

// FollowCompany handles POST /api/v1/companies/:id/follow.
func (h *ManagementHandler) FollowCompany(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	var payload models.FollowPayload
	_ = c.ShouldBindJSON(&payload)

	if err := h.service.FollowCompany(c.Request.Context(), actorFrom(c), companyID, payload); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"following": true})
}

// UnfollowCompany handles DELETE /api/v1/companies/:id/follow.
func (h *ManagementHandler) UnfollowCompany(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	if err := h.service.UnfollowCompany(c.Request.Context(), actorFrom(c), companyID); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"following": false})
}

// ---------------------------------------------------------------------------
// People and team
// ---------------------------------------------------------------------------

// GetPeople handles GET /api/v1/companies/:id/people.
func (h *ManagementHandler) GetPeople(c *gin.Context) {
	companyID, ok := h.resolveCompany(c)
	if !ok {
		return
	}
	var query models.PeopleQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	people, err := h.service.GetPeople(c.Request.Context(), actorFrom(c), companyID, query)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, people)
}

// RequestAssociation handles POST /api/v1/companies/:id/people.
func (h *ManagementHandler) RequestAssociation(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	var payload models.AssociationRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	person, err := h.service.RequestAssociation(c.Request.Context(), actorFrom(c), companyID, payload)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusAccepted, person)
}

// DecideAssociation handles PUT /api/v1/companies/:id/people/:memberId.
func (h *ManagementHandler) DecideAssociation(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	memberID, ok := pathUUID(c, "memberId")
	if !ok {
		return
	}
	var payload struct {
		Decision string `json:"decision" binding:"required,oneof=approve reject"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.DecideAssociation(c.Request.Context(), actorFrom(c), companyID, memberID,
		payload.Decision == "approve"); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": payload.Decision})
}

// GetTeam handles GET /api/v1/companies/:id/team.
func (h *ManagementHandler) GetTeam(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	var query models.PeopleQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team, err := h.service.GetTeam(c.Request.Context(), actorFrom(c), companyID, query)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, team)
}

// InviteTeamMember handles POST /api/v1/companies/:id/team/invite.
func (h *ManagementHandler) InviteTeamMember(c *gin.Context) {
	h.invite(c)
}

// InviteRecruiter handles POST /api/v1/companies/:id/recruiters/invite. It is
// the same operation as a team invitation; the service checks the permission
// that matches the role being granted, so this route cannot be used to hand out
// a role the caller could not hand out on the team page.
func (h *ManagementHandler) InviteRecruiter(c *gin.Context) {
	h.invite(c)
}

func (h *ManagementHandler) invite(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	var payload models.TeamInvitePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	issued, err := h.service.InviteMember(c.Request.Context(), actorFrom(c), companyID, payload)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, issued)
}

// UpdateTeamMember handles PUT /api/v1/companies/:id/team/:memberId.
func (h *ManagementHandler) UpdateTeamMember(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	memberID, ok := pathUUID(c, "memberId")
	if !ok {
		return
	}
	var payload models.TeamMemberUpdatePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateTeamMember(c.Request.Context(), actorFrom(c), companyID, memberID, payload); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"updated": true})
}

// RemoveTeamMember handles DELETE /api/v1/companies/:id/team/:memberId.
func (h *ManagementHandler) RemoveTeamMember(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	memberID, ok := pathUUID(c, "memberId")
	if !ok {
		return
	}

	if err := h.service.RemoveTeamMember(c.Request.Context(), actorFrom(c), companyID, memberID); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"removed": true})
}

// SetMemberPermissions handles PUT /api/v1/companies/:id/team/:memberId/permissions.
func (h *ManagementHandler) SetMemberPermissions(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	memberID, ok := pathUUID(c, "memberId")
	if !ok {
		return
	}
	var payload struct {
		Permissions []string `json:"permissions"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.SetMemberPermissions(c.Request.Context(), actorFrom(c), companyID, memberID, payload.Permissions); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"updated": true})
}

// GetPermissionCatalog handles GET /api/v1/companies/permissions. It describes
// the role and permission vocabulary so the settings screen does not have to
// hardcode a copy that can drift from the server's.
func (h *ManagementHandler) GetPermissionCatalog(c *gin.Context) {
	c.JSON(http.StatusOK, h.service.PermissionCatalog())
}

// GetRecruiters handles GET /api/v1/companies/:id/recruiters.
func (h *ManagementHandler) GetRecruiters(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	var query models.PeopleQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	recruiters, err := h.service.GetRecruiters(c.Request.Context(), actorFrom(c), companyID, query)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, recruiters)
}

// RemoveRecruiter handles DELETE /api/v1/companies/:id/recruiters/:recruiterId.
func (h *ManagementHandler) RemoveRecruiter(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	recruiterID, ok := pathUUID(c, "recruiterId")
	if !ok {
		return
	}

	if err := h.service.RemoveRecruiter(c.Request.Context(), actorFrom(c), companyID, recruiterID); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"removed": true})
}

// SuspendRecruiter handles PUT /api/v1/companies/:id/recruiters/:recruiterId.
func (h *ManagementHandler) SuspendRecruiter(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	recruiterID, ok := pathUUID(c, "recruiterId")
	if !ok {
		return
	}
	var payload struct {
		Suspended bool `json:"suspended"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.SuspendRecruiter(c.Request.Context(), actorFrom(c), companyID, recruiterID, payload.Suspended); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"suspended": payload.Suspended})
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

// ListInvitations handles GET /api/v1/companies/:id/invitations.
func (h *ManagementHandler) ListInvitations(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}

	invitations, err := h.service.ListInvitations(c.Request.Context(), actorFrom(c), companyID, c.Query("status"))
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": invitations})
}

// RevokeInvitation handles DELETE /api/v1/companies/:id/invitations/:invitationId.
func (h *ManagementHandler) RevokeInvitation(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	invitationID, ok := pathUUID(c, "invitationId")
	if !ok {
		return
	}

	if err := h.service.RevokeInvitation(c.Request.Context(), actorFrom(c), companyID, invitationID); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"revoked": true})
}

// PreviewInvitation handles GET /api/v1/companies/invitations/:token. It names
// the company and the role so the accept screen can be rendered; it does not
// join anybody to anything.
func (h *ManagementHandler) PreviewInvitation(c *gin.Context) {
	invitation, company, err := h.service.PreviewInvitation(c.Request.Context(), c.Param("token"))
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"invitation": invitation, "company": company})
}

// AcceptInvitation handles POST /api/v1/companies/invitations/:token/accept.
func (h *ManagementHandler) AcceptInvitation(c *gin.Context) {
	companyID, err := h.service.AcceptInvitation(c.Request.Context(), actorFrom(c), c.Param("token"))
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"companyId": companyID})
}

// DeclineInvitation handles POST /api/v1/companies/invitations/:token/decline.
func (h *ManagementHandler) DeclineInvitation(c *gin.Context) {
	if err := h.service.DeclineInvitation(c.Request.Context(), actorFrom(c), c.Param("token")); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"declined": true})
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

// GetVerification handles GET /api/v1/companies/:id/verification.
func (h *ManagementHandler) GetVerification(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}

	verification, err := h.service.GetVerification(c.Request.Context(), actorFrom(c), companyID)
	if err != nil {
		respondError(c, err)
		return
	}
	if verification == nil {
		c.JSON(http.StatusOK, gin.H{"status": "not_verified", "verification": nil})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": verification.Status, "verification": verification})
}

// SubmitVerification handles POST /api/v1/companies/:id/verification. It can
// only ever produce a pending review.
func (h *ManagementHandler) SubmitVerification(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	var payload models.VerificationSubmitPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	verification, err := h.service.SubmitVerification(c.Request.Context(), actorFrom(c), companyID, payload)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusAccepted, verification)
}

// ListPendingVerifications handles GET /api/v1/admin/company-verifications.
func (h *ManagementHandler) ListPendingVerifications(c *gin.Context) {
	page, limit := pagination(c, 20)

	items, total, err := h.service.ListPendingVerifications(c.Request.Context(), actorFrom(c), page, limit)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items, "total": total, "page": page, "limit": limit})
}

// DecideVerification handles PUT /api/v1/admin/company-verifications/:verificationId.
// The platform-admin check lives in the service, not only in the route group,
// so the decision stays protected even if the route is remounted.
func (h *ManagementHandler) DecideVerification(c *gin.Context) {
	verificationID, ok := pathUUID(c, "verificationId")
	if !ok {
		return
	}
	var payload models.VerificationDecisionPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.DecideVerification(c.Request.Context(), actorFrom(c), verificationID, payload); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": payload.Status})
}

// ---------------------------------------------------------------------------
// Jobs, dashboard and analytics
// ---------------------------------------------------------------------------

// GetJobs handles GET /api/v1/companies/:id/jobs.
func (h *ManagementHandler) GetJobs(c *gin.Context) {
	companyID, ok := h.resolveCompany(c)
	if !ok {
		return
	}
	page, limit := pagination(c, 20)

	jobs, err := h.service.GetJobs(c.Request.Context(), actorFrom(c), companyID, c.Query("status"), page, limit)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, jobs)
}

// GetDashboard handles GET /api/v1/companies/:id/dashboard.
func (h *ManagementHandler) GetDashboard(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}

	dashboard, err := h.service.GetDashboard(c.Request.Context(), actorFrom(c), companyID)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dashboard)
}

// GetAnalytics handles GET /api/v1/companies/:id/analytics.
func (h *ManagementHandler) GetAnalytics(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	from, err := parseDate(c.Query("from"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "from must be YYYY-MM-DD"})
		return
	}
	to, err := parseDate(c.Query("to"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "to must be YYYY-MM-DD"})
		return
	}

	analytics, err := h.service.GetAnalytics(c.Request.Context(), actorFrom(c), companyID, from, to)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, analytics)
}

// GetJobAnalytics handles GET /api/v1/companies/:id/jobs/:jobId/analytics.
func (h *ManagementHandler) GetJobAnalytics(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	jobID, ok := pathUUID(c, "jobId")
	if !ok {
		return
	}

	analytics, err := h.service.GetJobAnalytics(c.Request.Context(), actorFrom(c), companyID, jobID)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, analytics)
}

// GetInsights handles GET /api/v1/companies/:id/insights.
func (h *ManagementHandler) GetInsights(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	from, err := parseDate(c.Query("from"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "from must be YYYY-MM-DD"})
		return
	}
	to, err := parseDate(c.Query("to"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "to must be YYYY-MM-DD"})
		return
	}

	report, err := h.service.GenerateInsights(c.Request.Context(), actorFrom(c), companyID, from, to)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, report)
}

// GetDepartments handles GET /api/v1/company/:slug/departments, where the
// segment is an id or a slug. Departments are public: they carry counts, not
// the people behind them.
func (h *ManagementHandler) GetDepartments(c *gin.Context) {
	companyID, ok := h.resolveCompany(c)
	if !ok {
		return
	}

	departments, err := h.service.ListDepartments(c.Request.Context(), actorFrom(c), companyID)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, departments)
}

// GetAuditLog handles GET /api/v1/companies/:id/audit.
func (h *ManagementHandler) GetAuditLog(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	page, limit := pagination(c, 50)

	entries, total, err := h.service.GetAuditLog(c.Request.Context(), actorFrom(c), companyID, page, limit)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": entries, "total": total, "page": page, "limit": limit})
}

// parseDate reads an optional YYYY-MM-DD query parameter.
func parseDate(value string) (time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Time{}, nil
	}
	return time.Parse("2006-01-02", value)
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

// GetReviews handles GET /api/v1/companies/:id/reviews.
func (h *ManagementHandler) GetReviews(c *gin.Context) {
	companyID, ok := h.resolveCompany(c)
	if !ok {
		return
	}
	page, limit := pagination(c, 10)

	reviews, err := h.service.GetReviews(c.Request.Context(), actorFrom(c), companyID, page, limit)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, reviews)
}

// CreateReview handles POST /api/v1/companies/:id/reviews.
func (h *ManagementHandler) CreateReview(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	var payload models.ReviewPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	review, err := h.service.CreateReview(c.Request.Context(), actorFrom(c), companyID, payload)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, review)
}

// UpdateReview handles PUT /api/v1/companies/:id/reviews/:reviewId.
func (h *ManagementHandler) UpdateReview(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	reviewID, ok := pathUUID(c, "reviewId")
	if !ok {
		return
	}
	var payload models.ReviewPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	review, err := h.service.UpdateReview(c.Request.Context(), actorFrom(c), companyID, reviewID, payload)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, review)
}

// DeleteReview handles DELETE /api/v1/companies/:id/reviews/:reviewId.
func (h *ManagementHandler) DeleteReview(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	reviewID, ok := pathUUID(c, "reviewId")
	if !ok {
		return
	}

	if err := h.service.DeleteReview(c.Request.Context(), actorFrom(c), companyID, reviewID); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": true})
}

// ReportReview handles POST /api/v1/companies/:id/reviews/:reviewId/report.
func (h *ManagementHandler) ReportReview(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	reviewID, ok := pathUUID(c, "reviewId")
	if !ok {
		return
	}
	var payload models.ReviewReportPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ReportReview(c.Request.Context(), actorFrom(c), companyID, reviewID, payload); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"reported": true})
}

// RespondToReview handles POST /api/v1/companies/:id/reviews/:reviewId/response.
func (h *ManagementHandler) RespondToReview(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	reviewID, ok := pathUUID(c, "reviewId")
	if !ok {
		return
	}
	var payload models.ReviewResponsePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.RespondToReview(c.Request.Context(), actorFrom(c), companyID, reviewID, payload); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"responded": true})
}

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

// GetUpdates handles GET /api/v1/companies/:id/updates.
func (h *ManagementHandler) GetUpdates(c *gin.Context) {
	companyID, ok := h.resolveCompany(c)
	if !ok {
		return
	}
	page, limit := pagination(c, 10)

	updates, err := h.service.GetUpdates(c.Request.Context(), actorFrom(c), companyID, page, limit)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, updates)
}

// CreateUpdate handles POST /api/v1/companies/:id/updates.
func (h *ManagementHandler) CreateUpdate(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	var payload models.UpdatePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	update, err := h.service.CreateUpdate(c.Request.Context(), actorFrom(c), companyID, payload)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, update)
}

// EditUpdate handles PUT /api/v1/companies/:id/updates/:updateId.
func (h *ManagementHandler) EditUpdate(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	updateID, ok := pathUUID(c, "updateId")
	if !ok {
		return
	}
	var payload models.UpdatePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	update, err := h.service.EditUpdate(c.Request.Context(), actorFrom(c), companyID, updateID, payload)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, update)
}

// DeleteUpdate handles DELETE /api/v1/companies/:id/updates/:updateId.
func (h *ManagementHandler) DeleteUpdate(c *gin.Context) {
	companyID, ok := pathUUID(c, "id")
	if !ok {
		return
	}
	updateID, ok := pathUUID(c, "updateId")
	if !ok {
		return
	}

	if err := h.service.DeleteUpdate(c.Request.Context(), actorFrom(c), companyID, updateID); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": true})
}

func getActor(c *gin.Context) service.Actor {
	return actorFrom(c)
}

func handleError(c *gin.Context, err error) {
	respondError(c, err)
}

func parseCompanyID(c *gin.Context) (uuid.UUID, error) {
	companyID, err := uuid.Parse(c.Param("id"))
	if err == nil {
		return companyID, nil
	}
	if qID := c.Query("companyId"); qID != "" {
		if parsed, pErr := uuid.Parse(qID); pErr == nil {
			return parsed, nil
		}
	}
	if qID := c.Query("company_id"); qID != "" {
		if parsed, pErr := uuid.Parse(qID); pErr == nil {
			return parsed, nil
		}
	}
	return uuid.Nil, err
}

func (h *ManagementHandler) GetEmployerSettings(c *gin.Context) {
	actor := getActor(c)
	companyID, err := parseCompanyID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}
	settings, err := h.service.GetEmployerSettings(c.Request.Context(), actor, companyID)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, settings)
}

func (h *ManagementHandler) UpdateEmployerSettings(c *gin.Context) {
	actor := getActor(c)
	companyID, err := parseCompanyID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}
	var payload models.EmployerSettingsUpdatePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	settings, err := h.service.UpdateEmployerSettings(c.Request.Context(), actor, companyID, payload)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, settings)
}

func (h *ManagementHandler) TransferOwnership(c *gin.Context) {
	actor := getActor(c)
	companyID, err := parseCompanyID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}
	var payload models.TransferOwnershipPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.service.TransferOwnership(c.Request.Context(), actor, companyID, payload); err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Ownership transferred successfully"})
}

func (h *ManagementHandler) ResendInvitation(c *gin.Context) {
	actor := getActor(c)
	companyID, err := parseCompanyID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}
	invID, err := uuid.Parse(c.Param("invitationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invitation ID"})
		return
	}
	inv, err := h.service.ResendInvitation(c.Request.Context(), actor, companyID, invID)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, inv)
}

func (h *ManagementHandler) ExportCompanyData(c *gin.Context) {
	actor := getActor(c)
	companyID, err := parseCompanyID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}
	exp, err := h.service.ExportCompanyData(c.Request.Context(), actor, companyID)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, exp)
}

