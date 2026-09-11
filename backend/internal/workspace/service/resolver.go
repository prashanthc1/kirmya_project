// Package service resolves which workspaces an account may enter.
//
// The resolver is an aggregator, not an authority. Every rule it applies is
// owned by the domain that stores the underlying fact: company permissions come
// from the company module's role map, community management from the community
// module's own rule, recruiting from the recruiter capability introduced by the
// self-provisioning fix, platform administration from the same AdminRoles() the
// route middleware uses. This package decides nothing on its own, and adding a
// rule here rather than in its domain would create the second authorization
// system the architecture forbids.
package service

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"github.com/google/uuid"

	"kirmya/internal/workspace/domain"
)

// Routes for each workspace. These are the paths the application actually
// serves, verified against frontend/src/shared/routes.ts and the app router.
const (
	routeProfessional  = "/feed"
	routeFreelancer    = "/freelance"
	routeRecruiting    = "/recruiter" // not /recruiting: the served namespace wins
	routePlatformAdmin = "/admin"
)

// Labels. Entity workspaces use the entity's own name; these are the fixed ones.
const (
	labelProfessional  = "Professional"
	labelFreelancer    = "Freelancing"
	labelRecruiting    = "Recruiting"
	labelPlatformAdmin = "Kirmya Administration"

	fallbackCompanyLabel   = "Company"
	fallbackCommunityLabel = "Community"
)

// Account is the account-level state the resolver needs: whether the account may
// enter anything at all, and whether it administers the platform.
type Account struct {
	// Active reports whether the account itself is in good standing. A
	// non-active account gets no workspaces, privileged or otherwise.
	Active bool
	// IsPlatformAdmin mirrors the middleware's own decision. The reader
	// computes it with the shared AdminRoles() helper rather than handing back
	// a role string for this package to re-interpret, so there is exactly one
	// admin list in the codebase.
	IsPlatformAdmin bool
}

// CompanyGrant is one company the account may manage, already filtered by the
// company module's permission model.
type CompanyGrant struct {
	CompanyID string
	Name      string
	Slug      string
}

// CommunityGrant is one community the account may administer or moderate,
// already filtered by the community module's own rule.
type CommunityGrant struct {
	CommunityID string
	Title       string
}

// The readers below are narrow, read-only and owned by this package. They exist
// so the resolver depends on questions rather than on five other modules'
// repositories, and so a test can answer those questions without a database.
// Their implementations live in the workspace repository package and delegate
// to the authoritative domain code.

// AccountReader loads account standing and platform-admin status.
type AccountReader interface {
	Account(ctx context.Context, userID uuid.UUID) (Account, error)
}

// FreelancerReader answers whether the Freelancer capability is currently
// active. It must not be satisfied by checking whether a freelancer profile
// row exists: the capability lifecycle is the freelance module's to interpret,
// and profile existence was the old rule precisely because there was nothing
// else to ask.
type FreelancerReader interface {
	HasFreelancerCapability(ctx context.Context, userID uuid.UUID) (bool, error)
}

// RecruiterReader answers whether the standalone Recruiting capability is
// currently active. It must not be satisfied by reading recruiter tables
// directly: the capability lifecycle is the recruiter module's to interpret.
type RecruiterReader interface {
	HasRecruitingCapability(ctx context.Context, userID uuid.UUID) (bool, error)
}

// CompanyReader lists the companies where the account holds management or
// recruiting authority. Filtering is the company module's job, not this one's.
type CompanyReader interface {
	ManagedCompanies(ctx context.Context, userID uuid.UUID) ([]CompanyGrant, error)
}

// CommunityReader lists the communities the account may administer or moderate.
type CommunityReader interface {
	ManagedCommunities(ctx context.Context, userID uuid.UUID) ([]CommunityGrant, error)
}

// Resolver answers which workspaces an account may enter.
type Resolver struct {
	accounts    AccountReader
	freelancers FreelancerReader
	recruiters  RecruiterReader
	companies   CompanyReader
	communities CommunityReader
}

// NewResolver wires the resolver to its readers.
func NewResolver(
	accounts AccountReader,
	freelancers FreelancerReader,
	recruiters RecruiterReader,
	companies CompanyReader,
	communities CommunityReader,
) *Resolver {
	return &Resolver{
		accounts:    accounts,
		freelancers: freelancers,
		recruiters:  recruiters,
		companies:   companies,
		communities: communities,
	}
}

// professionalOnly is the floor: the list every active account has whatever
// else resolves, and the value ResolveForUser hands back alongside an error.
func professionalOnly() []domain.Workspace {
	return []domain.Workspace{{
		Key:       domain.KeyFor(domain.TypeProfessional, ""),
		Type:      domain.TypeProfessional,
		Label:     labelProfessional,
		Route:     routeProfessional,
		IsDefault: true,
	}}
}

// ErrAccountNotEligible is re-exported from the domain so callers of this
// package need not import both.
var ErrAccountNotEligible = domain.ErrAccountNotEligible

// ResolveForUser returns the workspaces this account may currently enter.
//
// Read-only, always: it performs no write of any kind and calls nothing that
// creates a record. That is a deliberate property rather than an accident of the
// current implementation - the recruiter self-provisioning defect was exactly a
// read path that created the authority it was asked about, and a resolver that
// provisioned while answering "what may I enter?" would reintroduce it at six
// times the surface area.
//
// Failure policy: fail-closed, and never silently. A domain lookup that errors
// aborts the resolution and returns the error, because a silently omitted
// company is indistinguishable to the user from a revoked one - a transient
// outage would read as "you were removed from Acme".
//
// Alongside the error it returns the professional-only list, which is the most
// any caller may serve when resolution failed. A caller on a path that cannot
// afford to fail - the bootstrap API - can degrade to that value, and a caller
// that ignores the error still cannot leak a privileged workspace. What such a
// caller must not do is present a degraded list as complete; that is why the
// error exists and why /auth/me carries a flag saying so.
func (r *Resolver) ResolveForUser(ctx context.Context, userID uuid.UUID) ([]domain.Workspace, error) {
	account, err := r.accounts.Account(ctx, userID)
	if err != nil {
		return nil, err
	}
	if !account.Active {
		// No workspaces at all, not even Professional. An account that may not
		// use the product may not be offered somewhere to use it.
		return nil, ErrAccountNotEligible
	}

	// Professional first, and unconditionally for an active account. It is the
	// floor: whatever else resolves, the account has somewhere to be.
	workspaces := professionalOnly()

	freelancing, err := r.freelancers.HasFreelancerCapability(ctx, userID)
	if err != nil {
		return professionalOnly(), fmt.Errorf("resolve freelancer workspace: %w", err)
	}
	if freelancing {
		workspaces = append(workspaces, domain.Workspace{
			Key:   domain.KeyFor(domain.TypeFreelancer, ""),
			Type:  domain.TypeFreelancer,
			Label: labelFreelancer,
			Route: routeFreelancer,
		})
	}

	recruiting, err := r.recruiters.HasRecruitingCapability(ctx, userID)
	if err != nil {
		return professionalOnly(), fmt.Errorf("resolve recruiting workspace: %w", err)
	}
	if recruiting {
		workspaces = append(workspaces, domain.Workspace{
			Key:   domain.KeyFor(domain.TypeRecruiting, ""),
			Type:  domain.TypeRecruiting,
			Label: labelRecruiting,
			Route: routeRecruiting,
		})
	}

	companies, err := r.companies.ManagedCompanies(ctx, userID)
	if err != nil {
		return professionalOnly(), fmt.Errorf("resolve company workspaces: %w", err)
	}
	for _, company := range companies {
		companyID := company.CompanyID
		workspaces = append(workspaces, domain.Workspace{
			Key:      domain.KeyFor(domain.TypeCompany, companyID),
			Type:     domain.TypeCompany,
			EntityID: &companyID,
			Label:    domain.SafeLabel(company.Name, fallbackCompanyLabel),
			Slug:     company.Slug,
			Route:    companyAdminRoute(company.Slug, companyID),
		})
	}

	communities, err := r.communities.ManagedCommunities(ctx, userID)
	if err != nil {
		return professionalOnly(), fmt.Errorf("resolve community workspaces: %w", err)
	}
	for _, community := range communities {
		communityID := community.CommunityID
		workspaces = append(workspaces, domain.Workspace{
			Key:      domain.KeyFor(domain.TypeCommunityAdmin, communityID),
			Type:     domain.TypeCommunityAdmin,
			EntityID: &communityID,
			Label:    domain.SafeLabel(community.Title, fallbackCommunityLabel),
			Route:    communityAdminRoute(communityID),
		})
	}

	if account.IsPlatformAdmin {
		workspaces = append(workspaces, domain.Workspace{
			Key:   domain.KeyFor(domain.TypePlatformAdmin, ""),
			Type:  domain.TypePlatformAdmin,
			Label: labelPlatformAdmin,
			Route: routePlatformAdmin,
		})
	}

	return sortAndDeduplicate(workspaces), nil
}

// companyAdminRoute builds the served company management path.
//
// The application routes companies by handle (/companies/{handle}/admin), and
// the handle is what the frontend's own route builders take. A company with no
// handle would produce "/companies//admin", which resolves to nothing, so the
// id is used instead - the route still fails to match a page, but it fails
// visibly at one company rather than silently corrupting the path.
func companyAdminRoute(slug, companyID string) string {
	handle := strings.TrimSpace(slug)
	if handle == "" {
		handle = companyID
	}
	return fmt.Sprintf("/companies/%s/admin", handle)
}

// communityAdminRoute builds the served community management path.
//
// Communities are routed by id: the model exposes no slug and every link in the
// application is built from community.id.
func communityAdminRoute(communityID string) string {
	return fmt.Sprintf("/communities/%s/admin", communityID)
}

// sortAndDeduplicate imposes a deterministic order and drops repeats.
//
// Ordering is by type, then alphabetically by label within the entity-scoped
// types, then by key so that two companies sharing a name still order stably.
// Nothing relies on the order rows come back from PostgreSQL in - a navigation
// list that reshuffles between refreshes is a bug the user experiences as the
// interface moving under their hand.
//
// Deduplication is by key. Duplicate underlying rows are possible (a company
// membership row plus an ownership row describe the same company), and one
// company must appear once.
func sortAndDeduplicate(workspaces []domain.Workspace) []domain.Workspace {
	sort.SliceStable(workspaces, func(i, j int) bool {
		left, right := workspaces[i], workspaces[j]
		if left.Type != right.Type {
			return left.Type.Rank() < right.Type.Rank()
		}
		if leftLabel, rightLabel := strings.ToLower(left.Label), strings.ToLower(right.Label); leftLabel != rightLabel {
			return leftLabel < rightLabel
		}
		return left.Key < right.Key
	})

	seen := make(map[string]bool, len(workspaces))
	out := make([]domain.Workspace, 0, len(workspaces))
	for _, workspace := range workspaces {
		if seen[workspace.Key] {
			continue
		}
		seen[workspace.Key] = true
		out = append(out, workspace)
	}
	return out
}
