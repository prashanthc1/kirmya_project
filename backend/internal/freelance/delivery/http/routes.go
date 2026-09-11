package http

import (
	"github.com/gin-gonic/gin"

	"kirmya/internal/freelance/service"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

// RegisterRoutes mounts the freelance module.
//
// The three groups below are the module's authority boundary in one place.
//
// # Public
//
// Project discovery. Anonymous, and it stays anonymous: browsing the
// marketplace is how somebody decides whether to become a freelancer, so
// requiring the capability to see it would make the capability unobtainable.
//
// # Authenticated
//
// Two different things share this group, and both belong here.
//
// Onboarding - reading your own draft, saving it, and completing it - is
// reachable by any signed-in professional account. That is the point: it is the
// deliberate act by which a professional becomes a freelancer, so gating it on
// already being one would close the only door in.
//
// Client-side marketplace actions - posting a project, accepting a proposal on
// your own project - are hiring, not freelancing. A company that hires a
// contractor is not itself a freelancer, and requiring the capability here
// would lock every client out of their own projects.
//
// GET /contracts is here for the reason set out at the freelancer-only group
// below.
//
// # Freelancer-only
//
// Acting as a freelancer. Requires an active capability.
func RegisterRoutes(api *gin.RouterGroup, handler *FreelanceHandler, svc service.FreelanceService) {
	freelanceGroup := api.Group("/freelance")
	{
		// Public discovery.
		freelanceGroup.GET("/projects", handler.GetProjects)
		freelanceGroup.GET("/projects/:id", handler.GetProjectByID)

		authenticated := freelanceGroup.Group("")
		authenticated.Use(sharedMiddleware.AuthRequired())
		{
			// Onboarding. Reachable by an ordinary professional account.
			authenticated.GET("/onboarding", handler.GetOnboardingStatus)
			authenticated.POST("/onboarding/complete", handler.CompleteOnboarding)
			authenticated.GET("/profile", handler.GetProfile)
			authenticated.POST("/profile", handler.SaveProfile)

			// Hiring. The caller here is the client, not the freelancer.
			authenticated.POST("/projects", handler.CreateProject)
			authenticated.POST("/proposals/:id/accept", handler.AcceptProposal)

			// Existing engagements, read-only, for both sides.
			//
			// Not behind the capability gate, for two independent reasons.
			// GetUserContracts returns the rows where the caller is the client
			// OR the freelancer, so gating it would deny a pure client their own
			// contracts. And a suspended freelancer keeps read access to
			// engagements they are already party to: suspension stops new
			// commercial activity, it does not erase an obligation that already
			// exists or hide its terms from the person bound by it.
			authenticated.GET("/contracts", handler.GetUserContracts)
		}

		freelancerOnly := freelanceGroup.Group("")
		freelancerOnly.Use(sharedMiddleware.AuthRequired(), RequireFreelancerCapability(svc))
		{
			// Submitting a proposal is the act of offering to be hired. It is
			// new commercial activity, and it is what a suspension has to stop.
			//
			// This group has one route because the module has one route that
			// means "acting as a freelancer" - the rest are discovery, hiring,
			// onboarding or shared history. Routes are classified by what the
			// operation is, not by how freelance-shaped the URL looks.
			freelancerOnly.POST("/projects/:id/proposals", handler.SubmitProposal)
		}
	}
}
