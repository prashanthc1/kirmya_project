package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/freelance/domain"
)

// This file carries the OpenAPI (swagger) contract for the freelance marketplace module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetProjects documents GET /api/v1/freelance/projects.
//
// @Summary      Get projects
// @Description  Returns projects via the Kirmya freelance marketplace module. Public endpoint; no authentication required.
// @Tags         Jobs
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/freelance/projects [get]
func swaggerGetProjects() {}

// swaggerGetProjectByID documents GET /api/v1/freelance/projects/{id}.
//
// @Summary      Get project by ID
// @Description  Returns project by ID via the Kirmya freelance marketplace module. Public endpoint; no authentication required.
// @Tags         Jobs
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/freelance/projects/{id} [get]
func swaggerGetProjectByID() {}

// swaggerCreateProject documents POST /api/v1/freelance/projects.
//
// @Summary      Create project
// @Description  Creates project via the Kirmya freelance marketplace module. Requires a valid Bearer access token.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreateProjectPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/projects [post]
func swaggerCreateProject() {}

// swaggerSubmitProposal documents POST /api/v1/freelance/projects/{id}/proposals.
//
// @Summary      Submit proposal
// @Description  Submits a proposal on a project. Requires a valid Bearer access token AND an active Freelancer capability: an account that has not completed freelancer onboarding, or whose freelancing has been suspended, is refused with 403 and a machine-readable code (FREELANCER_ONBOARDING_REQUIRED or FREELANCER_ACCESS_SUSPENDED). Freelancer capability is independent of the Kirmya account: suspending it stops freelancing only.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  domain.SubmitProposalPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse  "Freelancer capability is not active"
// @Security     BearerAuth
// @Router       /api/v1/freelance/projects/{id}/proposals [post]
func swaggerSubmitProposal() {}

// swaggerAcceptProposal documents POST /api/v1/freelance/proposals/{id}/accept.
//
// @Summary      Accept proposal
// @Description  Accepts proposal via the Kirmya freelance marketplace module. Requires a valid Bearer access token.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  object  false  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/proposals/{id}/accept [post]
func swaggerAcceptProposal() {}

// swaggerGetUserContracts documents GET /api/v1/freelance/contracts.
//
// @Summary      Get user contracts
// @Description  Returns user contracts via the Kirmya freelance marketplace module. Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/contracts [get]
func swaggerGetUserContracts() {}

// swaggerGetProfile documents GET /api/v1/freelance/profile.
//
// @Summary      Get profile
// @Description  Returns profile via the Kirmya freelance marketplace module. Requires a valid Bearer access token.
// @Tags         Jobs
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/profile [get]
func swaggerGetProfile() {}

// swaggerSaveProfile documents POST /api/v1/freelance/profile.
//
// @Summary      Save profile
// @Description  Saves profile via the Kirmya freelance marketplace module. Requires a valid Bearer access token.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        request  body  domain.SaveProfilePayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/profile [post]
func swaggerSaveProfile() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.SaveProfilePayload
	_ swagger.ErrorResponse
)

// swaggerGetFreelancerOnboarding documents GET /api/v1/freelance/onboarding.
//
// @Summary      Get freelancer onboarding status
// @Description  Reports where the caller stands on becoming a freelancer, and what onboarding still needs. `capability` is one of `none` (never started), `pending` (a profile draft exists but onboarding is not complete), `active` (the Freelancer capability is usable and the Freelancer workspace is served by /api/v1/auth/me) or `suspended` (an administrator withdrew freelancing; the Kirmya account itself is unaffected). This is a read: calling it never creates a freelancer profile, so an ordinary professional account may ask it in order to offer "Become a freelancer". Requires a valid Bearer access token, and nothing more - it is an onboarding route, not a freelancer-only one.
// @Tags         Jobs
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse  "Capability, the fields still required, and the caller's own draft"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/onboarding [get]
func swaggerGetFreelancerOnboarding() {}

// swaggerCompleteFreelancerOnboarding documents POST /api/v1/freelance/onboarding/complete.
//
// @Summary      Complete freelancer onboarding
// @Description  Activates the Freelancer capability. This is the only transition that grants it: saving a profile draft with POST /api/v1/freelance/profile creates a `pending` profile and grants nothing, and no read path creates the capability as a side effect. The draft must already carry an hourly rate, a tagline and at least one skill; otherwise the response is 400 with `missing` naming the fields. A suspended capability is not restored here - that is an administrative decision (POST /api/v1/admin/freelancers/{id}/reinstate). On success the Freelancer workspace appears in the next /api/v1/auth/me response without a new token.
// @Tags         Jobs
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse  "The activated freelancer profile"
// @Failure      400  {object}  swagger.ErrorResponse  "Onboarding is incomplete; `missing` names the fields"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse  "Freelancing is suspended for this account"
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/onboarding/complete [post]
func swaggerCompleteFreelancerOnboarding() {}

// swaggerAdminGetFreelancerCapability documents GET /api/v1/admin/freelancers/{id}.
//
// @Summary      Read a freelancer capability
// @Description  Reports one account's freelancer capability standing. Platform administration: requires the `freelancers.read` permission inside RequireAdmin.
// @Tags         Admin
// @Produce      json
// @Param        id  path  string  true  "User ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/freelancers/{id} [get]
func swaggerAdminGetFreelancerCapability() {}

// swaggerAdminSuspendFreelancer documents POST /api/v1/admin/freelancers/{id}/suspend.
//
// @Summary      Suspend a freelancer capability
// @Description  Withdraws freelancing from an account, and nothing else. The Kirmya account remains usable - feed, network, messages, job applications and every other capability the account holds are unaffected - and the freelancer profile, portfolio, proposals and contracts are preserved rather than deleted. The account keeps read access to contracts it is already party to; it cannot submit new proposals, and the Freelancer workspace stops being served by /api/v1/auth/me on the next request. A reason is required and is recorded. Requires the `freelancers.manage` permission inside RequireAdmin; this is deliberately not `users.suspend`, which suspends the whole account.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        id       path  string                   true  "User ID"
// @Param        request  body  swagger.ReasonRequest    true  "Reason for the decision"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse  "A reason is required"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse  "This account has no freelancer profile"
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/freelancers/{id}/suspend [post]
func swaggerAdminSuspendFreelancer() {}

// swaggerAdminReinstateFreelancer documents POST /api/v1/admin/freelancers/{id}/reinstate.
//
// @Summary      Reinstate a freelancer capability
// @Description  Returns a suspended account to active freelancing. It moves the existing profile back rather than creating one, so portfolio, reviews, proposals and contracts stay attached to the same freelancer identity and no second profile is produced. It cannot make a freelancer out of an account that never onboarded: that returns 404. A reason is required and is recorded. Requires the `freelancers.manage` permission inside RequireAdmin.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        id       path  string                   true  "User ID"
// @Param        request  body  swagger.ReasonRequest    true  "Reason for the decision"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse  "A reason is required"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse  "This account has no freelancer profile"
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/freelancers/{id}/reinstate [post]
func swaggerAdminReinstateFreelancer() {}
