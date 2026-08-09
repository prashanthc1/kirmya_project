package http

import (
	authMiddleware "kirmya/internal/auth/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes mounts the company module.
//
// The split below is the module's security boundary in one place: everything in
// `public` is safe for an anonymous visitor, and everything in `protected`
// requires a verified token. The services behind these handlers re-check the
// caller's authority per company, so this grouping is the outer gate, not the
// only one.
//
// auth is required. Passing nil would mount the write routes without
// authentication, so the function refuses to register them at all in that case.
func RegisterRoutes(api *gin.RouterGroup, handler *CompanyHandler, management *ManagementHandler, auth *authMiddleware.AuthMiddleware) {
	companies := api.Group("/companies")

	// Public reads. OptionalAuth attaches the caller when a token is present so
	// responses can carry viewer state, without ever requiring one.
	public := companies.Group("")
	if auth != nil {
		public.Use(auth.OptionalAuth())
	}
	{
		public.GET("", handler.ListDirectory)
		public.GET("/featured", handler.GetFeaturedCompanies)
		public.GET("/popular", handler.GetPopularCompanies)
		public.GET("/recommended", handler.GetRecommendations)
		public.GET("/industries", handler.GetIndustries)
		public.GET("/permissions", management.GetPermissionCatalog)
		public.GET("/search", management.SearchCompanies)
		public.GET("/discovery", management.Discovery)
		public.GET("/handle/:handle", handler.GetByHandle)

		public.GET("/:id", management.GetCompany)
		public.GET("/:id/people", management.GetPeople)
		public.GET("/:id/jobs", management.GetJobs)
		public.GET("/:id/reviews", management.GetReviews)
		public.GET("/:id/updates", management.GetUpdates)
		public.GET("/:id/employees", handler.GetCompanyEmployees)
		public.GET("/:id/leaders", handler.GetCompanyLeaders)
		public.GET("/:id/locations", handler.GetCompanyLocations)
		public.GET("/:id/departments", handler.GetCompanyDepartments)
		public.GET("/:id/gallery", handler.GetCompanyGallery)
	}

	if auth == nil {
		return
	}

	protected := companies.Group("")
	protected.Use(auth.RequireAuth())
	{
		protected.POST("", management.CreateCompany)
		protected.PUT("/:id", management.UpdateCompany)

		protected.GET("/mine", management.ListMyCompanies)
		protected.GET("/following", management.ListFollowing)
		protected.POST("/:id/follow", management.FollowCompany)
		protected.DELETE("/:id/follow", management.UnfollowCompany)
		protected.POST("/follow", handler.FollowCompany)
		protected.DELETE("/follow", handler.UnfollowCompany)
		protected.POST("/save", handler.SaveCompany)
		protected.DELETE("/save", handler.UnsaveCompany)
		protected.POST("/:id/report", handler.ReportCompany)

		protected.POST("/:id/people", management.RequestAssociation)
		protected.PUT("/:id/people/:memberId", management.DecideAssociation)

		protected.GET("/:id/team", management.GetTeam)
		protected.POST("/:id/team/invite", management.InviteTeamMember)
		protected.PUT("/:id/team/:memberId", management.UpdateTeamMember)
		protected.DELETE("/:id/team/:memberId", management.RemoveTeamMember)
		protected.PUT("/:id/team/:memberId/permissions", management.SetMemberPermissions)

		protected.GET("/:id/recruiters", management.GetRecruiters)
		protected.POST("/:id/recruiters/invite", management.InviteRecruiter)
		protected.PUT("/:id/recruiters/:recruiterId", management.SuspendRecruiter)
		protected.DELETE("/:id/recruiters/:recruiterId", management.RemoveRecruiter)

		protected.GET("/:id/invitations", management.ListInvitations)
		protected.DELETE("/:id/invitations/:invitationId", management.RevokeInvitation)
		protected.GET("/invitations/:token", management.PreviewInvitation)
		protected.POST("/invitations/:token/accept", management.AcceptInvitation)
		protected.POST("/invitations/:token/decline", management.DeclineInvitation)

		protected.GET("/:id/verification", management.GetVerification)
		protected.POST("/:id/verification", management.SubmitVerification)

		protected.GET("/:id/dashboard", management.GetDashboard)
		protected.GET("/:id/analytics", management.GetAnalytics)
		protected.GET("/:id/jobs/:jobId/analytics", management.GetJobAnalytics)
		protected.GET("/:id/insights", management.GetInsights)
		protected.GET("/:id/audit", management.GetAuditLog)

		protected.POST("/:id/reviews", management.CreateReview)
		protected.PUT("/:id/reviews/:reviewId", management.UpdateReview)
		protected.DELETE("/:id/reviews/:reviewId", management.DeleteReview)
		protected.POST("/:id/reviews/:reviewId/report", management.ReportReview)
		protected.POST("/:id/reviews/:reviewId/response", management.RespondToReview)

		protected.POST("/:id/updates", management.CreateUpdate)
		protected.PUT("/:id/updates/:updateId", management.EditUpdate)
		protected.DELETE("/:id/updates/:updateId", management.DeleteUpdate)
	}

	// The public company page reached by slug.
	companyPublic := api.Group("/company")
	companyPublic.Use(auth.OptionalAuth())
	{
		companyPublic.GET("/:slug", management.GetCompany)
		companyPublic.GET("/:slug/people", management.GetPeople)
		companyPublic.GET("/:slug/jobs", management.GetJobs)
		companyPublic.GET("/:slug/reviews", management.GetReviews)
		companyPublic.GET("/:slug/updates", management.GetUpdates)
		companyPublic.GET("/:slug/departments", management.GetDepartments)
	}

	// Company verification is decided by Kirmya administrators, never by the
	// company itself. RequireRole gates the route and the service re-checks the
	// platform role, so neither alone is load-bearing.
	admin := api.Group("/admin/company-verifications")
	admin.Use(auth.RequireAuth(), auth.RequireRole("admin", "super_admin"))
	{
		admin.GET("", management.ListPendingVerifications)
		admin.PUT("/:verificationId", management.DecideVerification)
	}
}
