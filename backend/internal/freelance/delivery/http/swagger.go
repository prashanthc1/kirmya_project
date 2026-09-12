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

// swaggerEnableFreelanceProfile documents POST /api/v1/freelance/profile/enable.
//
// @Summary      Enable freelancing for the caller
// @Description  Turns freelancing on for the authenticated account, creating the freelancer profile row if there is none. The capability this produces is 'pending', not 'active': enabling is not activation, and POST /api/v1/freelance/onboarding/complete is still required before the account may bid. Idempotent - calling it again on an account that already has a profile returns the current onboarding status and writes nothing, so it cannot reset a profile that has been filled in. An account whose freelancing has been suspended is refused with 403 and the code FREELANCER_ACCESS_SUSPENDED; enabling is not a route back from a suspension.
// @Tags         Jobs
// @Produce      json
// @Success      200  {object}  service.OnboardingStatus
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/profile/enable [post]
func swaggerEnableFreelanceProfile() {}

// swaggerListOwnProjects documents GET /api/v1/freelance/my/projects.
//
// @Summary      List the caller's own projects
// @Description  Returns the projects posted by the authenticated account, including drafts, which the public board at GET /api/v1/freelance/projects never shows. The listing is always scoped to the caller: the owner is taken from the verified session and there is no client_id parameter, so this endpoint cannot be pointed at another account's projects. Results use Kirmya's standard pagination envelope (page, limit, total_items, total_pages, data). Monetary filters are expressed in minor units - the same unit the amounts are stored in - so a range boundary cannot be shifted by a decimal conversion.
// @Tags         Jobs
// @Produce      json
// @Param        page                    query  int     false  "Page number (1-based)"  default(1)
// @Param        limit                   query  int     false  "Items per page (max 100)"  default(20)
// @Param        status                  query  string  false  "Comma-separated project statuses: draft, published, accepting_proposals, hired, active, completed, cancelled, disputed"
// @Param        skills                  query  string  false  "Comma-separated skills; matches a project requiring any of them"
// @Param        budget_type             query  string  false  "fixed or hourly"  Enums(fixed, hourly)
// @Param        currency                query  string  false  "ISO 4217 currency code, e.g. AED"
// @Param        min_budget_minor_units  query  int     false  "Minimum budget, in minor units (fils for AED)"
// @Param        max_budget_minor_units  query  int     false  "Maximum budget, in minor units (fils for AED)"
// @Param        q                       query  string  false  "Free-text search across title and description"
// @Param        sort                    query  string  false  "Ordering"  Enums(newest, oldest, budget_high, budget_low, recently_updated)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/my/projects [get]
func swaggerListOwnProjects() {}

// swaggerGetOwnProject documents GET /api/v1/freelance/my/projects/{id}.
//
// @Summary      Get one of the caller's own projects
// @Description  Returns a project the authenticated account posted, together with the proposals submitted to it - which the public read at GET /api/v1/freelance/projects/{id} does not include, because a bidding freelancer must not see what anybody else offered. A project belonging to another account answers 404 rather than 403: a 403 would confirm that the id names a real project, which would let an attacker map the board, including every unpublished draft, by walking identifiers.
// @Tags         Jobs
// @Produce      json
// @Param        id  path  string  true  "Project ID"
// @Success      200  {object}  domain.Project
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/my/projects/{id} [get]
func swaggerGetOwnProject() {}

// swaggerUpdateOwnProject documents PATCH /api/v1/freelance/my/projects/{id}.
//
// @Summary      Update one of the caller's own projects
// @Description  Applies a partial update to a project the authenticated account posted. Every field is optional; a field that is absent is left alone, which is what distinguishes "clear this description" from "do not touch the description". A project owned by another account answers 404, for the same reason as the read above. A status change is checked against the project lifecycle rather than assigned freely: moving a draft straight to completed, or reviving a cancelled project, is refused with 409 and the code FREELANCE_ILLEGAL_TRANSITION naming both ends of the attempted move. A completed or cancelled project is terminal and refuses edits entirely.
// @Tags         Jobs
// @Accept       json
// @Produce      json
// @Param        id       path  string                      true  "Project ID"
// @Param        request  body  domain.UpdateProjectPayload  true  "Fields to change"
// @Success      200  {object}  domain.Project
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/freelance/my/projects/{id} [patch]
func swaggerUpdateOwnProject() {}

// swaggerAdminListFreelanceProjects documents GET /api/v1/admin/freelance/projects.
//
// @Summary      List marketplace projects across accounts
// @Description  Administrative, cross-account view of freelance projects. Requires an administrator session AND the freelance.admin.read permission - RequireAdmin is the outer gate and the named permission is the inner one, so a generic administrator who has been narrowed to a role without this permission is refused with 403 ADMIN_PERMISSION_REQUIRED. Unlike GET /api/v1/freelance/my/projects, this endpoint accepts a client_id parameter and is not scoped to the caller; that is precisely why it is gated on a named permission rather than on RequireAdmin alone. Accepts the same filters and returns the same pagination envelope as the owner-scoped listing.
// @Tags         Admin
// @Produce      json
// @Param        client_id  query  string  false  "Restrict to one client's projects"
// @Param        page       query  int     false  "Page number (1-based)"  default(1)
// @Param        limit      query  int     false  "Items per page (max 100)"  default(20)
// @Param        status     query  string  false  "Comma-separated project statuses"
// @Param        sort       query  string  false  "Ordering"  Enums(newest, oldest, budget_high, budget_low, recently_updated)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/freelance/projects [get]
func swaggerAdminListFreelanceProjects() {}

// swaggerAdminCancelFreelanceProject documents POST /api/v1/admin/freelance/projects/{id}/cancel.
//
// @Summary      Cancel a marketplace project
// @Description  Takes an abusive or fraudulent project off the marketplace. Requires an administrator session AND the freelance.admin.write permission; the read permission alone is not sufficient, so a support desk can see a posting without being able to remove it. A reason is mandatory and is recorded in the audit entry alongside the administrator, the project, its owner and the state it was cancelled from - an administrative removal with no stated justification is indistinguishable from a mistake after the fact. The cancellation goes through the same project lifecycle a client's own edit does: a project already completed or cancelled cannot be cancelled again and answers 409 FREELANCE_ILLEGAL_TRANSITION.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        id       path  string  true  "Project ID"
// @Param        request  body  object  true  "Reason for removal"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      409  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/freelance/projects/{id}/cancel [post]
func swaggerAdminCancelFreelanceProject() {}
