package http

import (
	"github.com/gin-gonic/gin"

	"kirmya/internal/freelance/service"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

// RegisterRoutes mounts the freelance module.
//
// The module owns its own routing: internal/router calls this one function and
// knows nothing about the paths inside. Every route lives under
// /api/v1/freelance, and the groups below are the module's authority boundary in
// one place.
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
// Client-side marketplace actions - posting a project, editing your own,
// accepting a proposal on it - are hiring, not freelancing. A company that hires
// a contractor is not itself a freelancer, and requiring the capability here
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
			// Enabling freelancing is its own act, distinct from saving a
			// profile: it creates the pending capability and nothing else.
			authenticated.POST("/profile/enable", handler.EnableFreelanceProfile)

			// Hiring. The caller here is the client, not the freelancer.
			authenticated.POST("/projects", handler.CreateProject)
			authenticated.POST("/proposals/:id/accept", handler.AcceptProposal)

			// The caller's own projects, including drafts.
			//
			// Under /my/ rather than reusing /projects/:id, and that separation
			// is load-bearing rather than cosmetic. /projects/:id is the public
			// read: it must never show a draft or a competitor's bids. These
			// routes are owner-scoped and show both. Two different audiences
			// cannot safely share one handler whose behaviour depends on who is
			// asking, because the version that forgets to check is the one that
			// leaks.
			myProjects := authenticated.Group("/my/projects")
			{
				myProjects.GET("", handler.ListOwnProjects)
				myProjects.GET("/:id", handler.GetOwnProject)
				myProjects.PATCH("/:id", handler.UpdateOwnProject)
			}

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
			freelancerOnly.POST("/projects/:id/proposals", handler.SubmitProposal)
		}
	}
}

// The route groups the rest of the marketplace will mount under.
//
// Deliberately not registered anywhere yet, and deliberately not stubbed.
//
// A group with no routes registers nothing in Gin, so listing them here would
// change no behaviour - but it would also prove nothing, and the alternative
// that does get written in situations like this is a handler returning
// {"status":"ok"} so the path "exists". That is worse than a missing route: a
// 404 tells a client the feature is not built, while a 200 carrying nothing
// tells them it is built and broken, and every consumer written against it has
// to be rewritten when the real behaviour arrives.
//
// So the prepared surface is documented rather than mounted. The schema for all
// of it exists (migration 0102), the domain types exist, and the path each will
// take is fixed:
//
//	POST   /api/v1/freelance/projects/:id/publish     publish a draft
//	GET    /api/v1/freelance/my/proposals             a freelancer's own bids
//	POST   /api/v1/freelance/projects/:id/proposals   (mounted)
//	PATCH  /api/v1/freelance/my/proposals/:id         withdraw or revise
//	GET    /api/v1/freelance/services                 the service marketplace
//	POST   /api/v1/freelance/services                 publish a service
//	GET    /api/v1/freelance/contracts/:id            one engagement
//	POST   /api/v1/freelance/contracts/:id/milestones the schedule of work
//	POST   /api/v1/freelance/contracts/:id/deliveries submit work
//	POST   /api/v1/freelance/contracts/:id/reviews    rate the other party
//	POST   /api/v1/freelance/contracts/:id/disputes   raise a dispute
//	POST   /api/v1/freelance/disputes/:id/evidence    support a dispute
//	GET    /api/v1/freelance/verification             trading-identity checks
//	GET    /api/v1/freelance/favorites                saved items
//	POST   /api/v1/freelance/favorites                save one
//
// Payments and payouts are absent from that list on purpose: no processor has
// been chosen, and the two tables that exist for them carry no provider-specific
// columns for the same reason.
