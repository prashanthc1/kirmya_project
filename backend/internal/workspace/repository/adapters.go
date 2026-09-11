// Package repository adapts the authoritative domain modules to the narrow
// read-only questions the workspace resolver asks.
//
// Every adapter here is a translation, not a decision. The rule that decides
// whether a company grant means management lives in the company module's
// permission map; the rule that decides whether a community membership carries
// authority lives on the community membership model; recruiting eligibility is
// the recruiter service's answer; platform administration is the same
// AdminRoles() the route middleware enforces. If a rule ever appears in this
// file that is not stated somewhere else, the resolver has quietly become a
// second authorization system and that is the bug.
package repository

import (
	"context"

	"github.com/google/uuid"

	authRepo "kirmya/internal/auth/repository"
	communityRepo "kirmya/internal/community/repository"
	companyDomain "kirmya/internal/company/domain"
	companyRepo "kirmya/internal/company/repository"
	freelanceService "kirmya/internal/freelance/service"
	recruiterService "kirmya/internal/recruiter/service"
	sharedMiddleware "kirmya/internal/shared/middleware"
	workspaceService "kirmya/internal/workspace/service"
)

// activeAccountStatus is the users.status value that means the account may use
// the product. It is the same value the column defaults to.
const activeAccountStatus = "active"

// AccountAdapter answers account standing and platform administration.
type AccountAdapter struct{ users *authRepo.AuthRepository }

// NewAccountAdapter builds the account reader.
func NewAccountAdapter(users *authRepo.AuthRepository) *AccountAdapter {
	return &AccountAdapter{users: users}
}

// Account loads the user and reports whether they are active and whether they
// administer the platform.
//
// Platform administration mirrors RequireAdmin() exactly, by asking the same
// AdminRoles() helper the middleware asks. It deliberately does not consult
// admin_user_roles: that table implements a real RBAC which RequireAdmin has
// never read, so a workspace derived from it would offer an admin surface the
// admin routes then refuse. The resolver mirrors enforced authority, and
// reconciling the two admin systems is a separate decision.
func (a *AccountAdapter) Account(ctx context.Context, userID uuid.UUID) (workspaceService.Account, error) {
	user, err := a.users.GetUserByID(ctx, userID)
	if err != nil {
		return workspaceService.Account{}, err
	}

	isAdmin := false
	for _, role := range sharedMiddleware.AdminRoles() {
		if user.RoleID == role {
			isAdmin = true
			break
		}
	}

	return workspaceService.Account{
		Active:          user.Status == activeAccountStatus,
		IsPlatformAdmin: isAdmin,
	}, nil
}

// FreelancerAdapter answers whether the Freelancer capability is active.
type FreelancerAdapter struct {
	freelance freelanceService.FreelanceService
}

// NewFreelancerAdapter builds the freelancer reader.
func NewFreelancerAdapter(freelance freelanceService.FreelanceService) *FreelancerAdapter {
	return &FreelancerAdapter{freelance: freelance}
}

// HasFreelancerCapability reports whether the account currently holds usable
// Freelancer capability.
//
// It asks the freelance service rather than reading freelancer_profiles, so the
// answer here and the answer RequireFreelancerCapability gives on every
// freelancer-only route come from the same code. Only an active capability
// qualifies: none, pending and suspended are all "no", and none of them is
// distinguished in a navigation list.
//
// This used to be profile existence, which is why a freelancer could not be
// suspended without suspending their whole Kirmya account - there was no state
// between "has a row" and "has no row". Account-level standing is still honoured
// one level up, where the resolver refuses every workspace for an account that
// may not authenticate.
func (a *FreelancerAdapter) HasFreelancerCapability(ctx context.Context, userID uuid.UUID) (bool, error) {
	capability, err := a.freelance.FreelancerCapability(ctx, userID)
	if err != nil {
		return false, err
	}
	return capability == freelanceService.CapabilityActive, nil
}

// RecruiterAdapter answers whether the standalone Recruiting capability holds.
type RecruiterAdapter struct {
	recruiters *recruiterService.RecruiterService
}

// NewRecruiterAdapter builds the recruiter reader.
func NewRecruiterAdapter(recruiters *recruiterService.RecruiterService) *RecruiterAdapter {
	return &RecruiterAdapter{recruiters: recruiters}
}

// HasRecruitingCapability reports whether the account currently holds the
// standalone Recruiting capability.
//
// It asks the recruiter service rather than reading recruiter tables, so the
// answer here and the answer RequireRecruiterCapability gives on every
// privileged /recruiter/* route come from the same code. Only an active
// capability qualifies: pending, suspended and absent are all "no", and none of
// them is distinguished in a navigation list.
func (a *RecruiterAdapter) HasRecruitingCapability(ctx context.Context, userID uuid.UUID) (bool, error) {
	capability, err := a.recruiters.RecruiterCapability(ctx, userID)
	if err != nil {
		return false, err
	}
	return capability == recruiterService.CapabilityActive, nil
}

// managementPermissions is the set that distinguishes a company workspace from
// mere membership.
//
// Holding any one of them means the account has something to manage: the
// company itself, its team, its hiring, or the applications that hiring
// produces. Under the company module's role map this admits company_owner,
// org_admin, recruiter_admin, hiring_manager and recruiter, and excludes
// employee (company:view alone) and viewer (view-only), which is the intended
// line - a private dashboard someone can read is not a workspace they manage.
//
// application:view earns its place: seeing candidate applications is recruiting
// work, and an account doing it needs the company surface even without the
// right to edit the company profile.
var managementPermissions = []companyDomain.Permission{
	companyDomain.PermCompanyEdit,
	companyDomain.PermSettingsEdit,
	companyDomain.PermBrandingEdit,
	companyDomain.PermTeamManage,
	companyDomain.PermTeamInvite,
	companyDomain.PermPeopleApprove,
	companyDomain.PermPermissionEdit,
	companyDomain.PermJobCreate,
	companyDomain.PermJobEdit,
	companyDomain.PermJobPublish,
	companyDomain.PermJobClose,
	companyDomain.PermRecruiterManage,
	companyDomain.PermRecruiterInvite,
	companyDomain.PermApplicationView,
}

// CompanyAdapter lists the companies an account may manage.
type CompanyAdapter struct {
	companies *companyRepo.ManagementRepository
}

// NewCompanyAdapter builds the company reader.
func NewCompanyAdapter(companies *companyRepo.ManagementRepository) *CompanyAdapter {
	return &CompanyAdapter{companies: companies}
}

// ManagedCompanies returns one entry per company where the account's effective
// permissions include management authority.
//
// The grant is built by the company repository with the same 'approved' status
// filter LoadGrant applies, and the decision is Grant.Has - the company
// module's own permission lookup - so revoking a membership or demoting a role
// removes the workspace on the next call without anything here changing.
func (a *CompanyAdapter) ManagedCompanies(ctx context.Context, userID uuid.UUID) ([]workspaceService.CompanyGrant, error) {
	grants, err := a.companies.ListUserGrants(ctx, userID)
	if err != nil {
		return nil, err
	}

	out := make([]workspaceService.CompanyGrant, 0, len(grants))
	for _, entry := range grants {
		if !managesCompany(entry.Grant) {
			continue
		}
		out = append(out, workspaceService.CompanyGrant{
			CompanyID: entry.CompanyID,
			Name:      entry.Name,
			Slug:      entry.Slug,
		})
	}
	return out, nil
}

// managesCompany reports whether a grant carries any management permission.
func managesCompany(grant companyDomain.Grant) bool {
	for _, perm := range managementPermissions {
		if grant.Has(perm) {
			return true
		}
	}
	return false
}

// CommunityAdapter lists the communities an account may administer or moderate.
type CommunityAdapter struct {
	communities *communityRepo.CommunityRepository
}

// NewCommunityAdapter builds the community reader.
func NewCommunityAdapter(communities *communityRepo.CommunityRepository) *CommunityAdapter {
	return &CommunityAdapter{communities: communities}
}

// ManagedCommunities returns one entry per community the account may manage.
//
// The repository has already applied CanModerate, which is the same rule the
// community service's own isModeratorOrHigher applies per request, so a banned
// owner or a demoted admin loses the workspace exactly when they lose the
// surface behind it.
func (a *CommunityAdapter) ManagedCommunities(ctx context.Context, userID uuid.UUID) ([]workspaceService.CommunityGrant, error) {
	memberships, err := a.communities.ListManagedMemberships(ctx, userID)
	if err != nil {
		return nil, err
	}

	out := make([]workspaceService.CommunityGrant, 0, len(memberships))
	for _, membership := range memberships {
		out = append(out, workspaceService.CommunityGrant{
			CommunityID: membership.CommunityID.String(),
			Title:       membership.Title,
		})
	}
	return out, nil
}
