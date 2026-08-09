// Package domain holds the company module's vocabulary: the org-scoped roles,
// the permissions those roles carry, and the state machines for membership,
// verification and invitations.
//
// Authorization here is company-scoped, not global. A user who is an owner of
// company A holds no permission at all on company B, and every check takes the
// company as an argument so that "which company" can never be forgotten.
package domain

import "strings"

// Role is a company-scoped role. A user may hold more than one on the same
// company (a hiring manager who also recruits), in which case their effective
// permissions are the union.
type Role string

const (
	// RoleCompanyOwner is the one role that can transfer or delete the company.
	RoleCompanyOwner Role = "company_owner"
	// RoleOrgAdmin administers everything except ownership itself.
	RoleOrgAdmin Role = "org_admin"
	// RoleRecruiterAdmin manages the recruiting team and all hiring data.
	RoleRecruiterAdmin Role = "recruiter_admin"
	// RoleHiringManager owns requisitions and sees the funnel for them.
	RoleHiringManager Role = "hiring_manager"
	// RoleRecruiter works candidates on jobs but cannot change the company.
	RoleRecruiter Role = "recruiter"
	// RoleEmployee is an approved employee association with no admin rights.
	RoleEmployee Role = "employee"
	// RoleViewer is read-only access to the company's private dashboard.
	RoleViewer Role = "viewer"
)

// Permission is a single capability inside one company.
type Permission string

const (
	PermCompanyView   Permission = "company:view"
	PermCompanyEdit   Permission = "company:edit"
	PermCompanyDelete Permission = "company:delete"
	PermBrandingEdit  Permission = "branding:edit"
	PermSettingsEdit  Permission = "settings:edit"

	PermVerificationView   Permission = "verification:view"
	PermVerificationSubmit Permission = "verification:submit"

	PermTeamView       Permission = "team:view"
	PermTeamInvite     Permission = "team:invite"
	PermTeamManage     Permission = "team:manage"
	PermPeopleApprove  Permission = "people:approve"
	PermPermissionEdit Permission = "permission:edit"

	PermRecruiterView   Permission = "recruiter:view"
	PermRecruiterInvite Permission = "recruiter:invite"
	PermRecruiterManage Permission = "recruiter:manage"

	PermJobView         Permission = "job:view"
	PermJobCreate       Permission = "job:create"
	PermJobEdit         Permission = "job:edit"
	PermJobPublish      Permission = "job:publish"
	PermJobClose        Permission = "job:close"
	PermApplicationView Permission = "application:view"

	PermAnalyticsView    Permission = "analytics:view"
	PermJobAnalyticsView Permission = "analytics:job:view"
	PermAuditView        Permission = "audit:view"
	PermAIInsights       Permission = "ai:insights"

	PermUpdateCreate  Permission = "update:create"
	PermUpdatePublish Permission = "update:publish"
	PermUpdateDelete  Permission = "update:delete"

	PermReviewRespond  Permission = "review:respond"
	PermReviewModerate Permission = "review:moderate"
)

// rolePermissions is the whole authorization model for the module. Anything not
// listed for a role is denied; there is no implicit inheritance and no wildcard,
// so adding a permission means deciding explicitly who gets it.
var rolePermissions = map[Role]map[Permission]bool{
	RoleCompanyOwner: permSet(
		PermCompanyView, PermCompanyEdit, PermCompanyDelete, PermBrandingEdit, PermSettingsEdit,
		PermVerificationView, PermVerificationSubmit,
		PermTeamView, PermTeamInvite, PermTeamManage, PermPeopleApprove, PermPermissionEdit,
		PermRecruiterView, PermRecruiterInvite, PermRecruiterManage,
		PermJobView, PermJobCreate, PermJobEdit, PermJobPublish, PermJobClose, PermApplicationView,
		PermAnalyticsView, PermJobAnalyticsView, PermAuditView, PermAIInsights,
		PermUpdateCreate, PermUpdatePublish, PermUpdateDelete,
		PermReviewRespond, PermReviewModerate,
	),
	RoleOrgAdmin: permSet(
		PermCompanyView, PermCompanyEdit, PermBrandingEdit, PermSettingsEdit,
		PermVerificationView, PermVerificationSubmit,
		PermTeamView, PermTeamInvite, PermTeamManage, PermPeopleApprove, PermPermissionEdit,
		PermRecruiterView, PermRecruiterInvite, PermRecruiterManage,
		PermJobView, PermJobCreate, PermJobEdit, PermJobPublish, PermJobClose, PermApplicationView,
		PermAnalyticsView, PermJobAnalyticsView, PermAuditView, PermAIInsights,
		PermUpdateCreate, PermUpdatePublish, PermUpdateDelete,
		PermReviewRespond, PermReviewModerate,
	),
	RoleRecruiterAdmin: permSet(
		PermCompanyView,
		PermVerificationView,
		PermTeamView,
		PermRecruiterView, PermRecruiterInvite, PermRecruiterManage,
		PermJobView, PermJobCreate, PermJobEdit, PermJobPublish, PermJobClose, PermApplicationView,
		PermAnalyticsView, PermJobAnalyticsView, PermAIInsights,
		PermUpdateCreate, PermUpdatePublish,
	),
	RoleHiringManager: permSet(
		PermCompanyView,
		PermTeamView,
		PermRecruiterView,
		PermJobView, PermJobCreate, PermJobEdit, PermJobClose, PermApplicationView,
		PermAnalyticsView, PermJobAnalyticsView, PermAIInsights,
	),
	RoleRecruiter: permSet(
		PermCompanyView,
		PermTeamView,
		PermJobView, PermJobCreate, PermJobEdit, PermApplicationView,
		PermJobAnalyticsView,
	),
	RoleEmployee: permSet(
		PermCompanyView,
	),
	RoleViewer: permSet(
		PermCompanyView,
		PermJobView,
		PermAnalyticsView,
	),
}

func permSet(perms ...Permission) map[Permission]bool {
	set := make(map[Permission]bool, len(perms))
	for _, p := range perms {
		set[p] = true
	}
	return set
}

// AllRoles lists every valid role, ordered from most to least privileged.
func AllRoles() []Role {
	return []Role{
		RoleCompanyOwner, RoleOrgAdmin, RoleRecruiterAdmin,
		RoleHiringManager, RoleRecruiter, RoleEmployee, RoleViewer,
	}
}

// ParseRole accepts a stored or submitted role string. Unknown values are
// rejected rather than mapped onto a default, so a typo cannot silently become
// a privileged role.
func ParseRole(value string) (Role, bool) {
	candidate := Role(strings.ToLower(strings.TrimSpace(value)))
	if _, ok := rolePermissions[candidate]; ok {
		return candidate, true
	}
	return "", false
}

// Permissions returns the permissions a role carries, as a sorted-free set copy.
func (r Role) Permissions() []Permission {
	granted := rolePermissions[r]
	out := make([]Permission, 0, len(granted))
	for perm := range granted {
		out = append(out, perm)
	}
	return out
}

// Rank orders roles by privilege, highest first (0 = owner). Unknown roles rank
// below everything so they can never win a comparison.
func (r Role) Rank() int {
	for i, role := range AllRoles() {
		if role == r {
			return i
		}
	}
	return len(AllRoles())
}

// Has reports whether the role carries the permission.
func (r Role) Has(perm Permission) bool {
	return rolePermissions[r][perm]
}

// Grant is a user's effective authority on one company: the roles they hold
// plus any individually granted extras. Extras only ever add; a role's
// permissions cannot be revoked per-member, so narrowing requires a role change.
type Grant struct {
	CompanyID string
	UserID    string
	Roles     []Role
	Extra     []Permission
}

// Has reports whether the grant carries the permission through any of its roles
// or its extras.
func (g Grant) Has(perm Permission) bool {
	for _, role := range g.Roles {
		if role.Has(perm) {
			return true
		}
	}
	for _, extra := range g.Extra {
		if extra == perm {
			return true
		}
	}
	return false
}

// HighestRole returns the most privileged role in the grant, or false when the
// grant is empty — which is the normal answer for a user with no relationship
// to the company.
func (g Grant) HighestRole() (Role, bool) {
	best := Role("")
	bestRank := len(AllRoles())
	for _, role := range g.Roles {
		if rank := role.Rank(); rank < bestRank {
			best, bestRank = role, rank
		}
	}
	if best == "" {
		return "", false
	}
	return best, true
}

// CanAssign reports whether a grant holder may give out the target role. A
// member can never grant a role at or above their own level, which is what
// stops a recruiter admin from promoting themselves to owner, and ownership can
// only be handed over by the current owner.
func (g Grant) CanAssign(target Role) bool {
	if !g.Has(PermTeamManage) && !g.Has(PermRecruiterManage) {
		return false
	}
	actor, ok := g.HighestRole()
	if !ok {
		return false
	}
	if target == RoleCompanyOwner {
		return actor == RoleCompanyOwner
	}
	return target.Rank() > actor.Rank()
}
