package domain

import "sort"

// The freelance permission vocabulary.
//
// Two kinds of authority live in this module, and conflating them is the
// mistake this file exists to prevent.
//
// # Per-account permissions
//
// Everything ending in _own, and the create verbs. These are not administrative
// permissions and deliberately do not appear in admin_permissions. They answer
// "may this account do this to its own things", and the answer always depends on
// a row: whether the caller is the client who posted the project, the freelancer
// who wrote the proposal, or a party to the contract.
//
// A permission system keyed on roles cannot answer that. Granting
// "freelance.project.manage_own" to a role would say nothing about *which*
// projects, so the guard would pass and the caller would still reach somebody
// else's row - which is precisely the IDOR this module has to avoid. So these
// codes name the operation, and Authorize() in the service layer pairs each one
// with the ownership fact that makes it true.
//
// # Administrative permissions
//
// PermAdminRead and PermAdminWrite. These are the two that are seeded into
// admin_permissions by migration 0102 and enforced by the existing
// internal/admin/authz guard, exactly like every other administrative
// permission in Kirmya. They are what lets a support or trust-and-safety
// administrator look at, and rule on, marketplace records belonging to other
// people.
//
// There is no second authorization framework here: the administrative half uses
// the admin guard the rest of the platform uses, and the per-account half is
// ownership checking, which is what it has always been.
const (
	// Profile.
	PermProfileManageOwn = "freelance.profile.manage_own"

	// Projects: the client side.
	PermProjectCreate    = "freelance.project.create"
	PermProjectManageOwn = "freelance.project.manage_own"

	// Proposals: the freelancer side.
	PermProposalCreate    = "freelance.proposal.create"
	PermProposalManageOwn = "freelance.proposal.manage_own"

	// Contracts. view_own is held by both parties; manage is the narrower
	// authority to move the contract's state.
	PermContractViewOwn = "freelance.contract.view_own"
	PermContractManage  = "freelance.contract.manage"

	// Productised services.
	PermServiceCreate    = "freelance.service.create"
	PermServiceManageOwn = "freelance.service.manage_own"

	// Reviews and disputes.
	PermReviewCreate  = "freelance.review.create"
	PermDisputeCreate = "freelance.dispute.create"
	// PermDisputeManage is the authority to decide a dispute, not to raise one.
	PermDisputeManage = "freelance.dispute.manage"

	// The administrative pair. These two, and only these two, are seeded into
	// admin_permissions.
	PermAdminRead  = "freelance.admin.read"
	PermAdminWrite = "freelance.admin.write"
)

// accountPermissions is every per-account code.
var accountPermissions = []string{
	PermProfileManageOwn,
	PermProjectCreate, PermProjectManageOwn,
	PermProposalCreate, PermProposalManageOwn,
	PermContractViewOwn, PermContractManage,
	PermServiceCreate, PermServiceManageOwn,
	PermReviewCreate,
	PermDisputeCreate, PermDisputeManage,
}

// adminPermissions is every code seeded into admin_permissions.
//
// Kept as its own list so a test can assert that migration 0102 seeds exactly
// these and that no per-account code leaked into the administrative vocabulary.
var adminPermissions = []string{PermAdminRead, PermAdminWrite}

// AccountPermissions returns the per-account codes, sorted.
func AccountPermissions() []string {
	out := append([]string(nil), accountPermissions...)
	sort.Strings(out)
	return out
}

// AdminPermissions returns the administrative codes, sorted.
func AdminPermissions() []string {
	out := append([]string(nil), adminPermissions...)
	sort.Strings(out)
	return out
}

// AllPermissions returns every freelance permission code, sorted.
func AllPermissions() []string {
	out := append(AccountPermissions(), adminPermissions...)
	sort.Strings(out)
	return out
}

// IsAdminPermission reports whether a code belongs to the administrative half.
func IsAdminPermission(code string) bool {
	for _, candidate := range adminPermissions {
		if candidate == code {
			return true
		}
	}
	return false
}

// IsKnownPermission reports whether the code is part of this vocabulary at all.
func IsKnownPermission(code string) bool {
	if IsAdminPermission(code) {
		return true
	}
	for _, candidate := range accountPermissions {
		if candidate == code {
			return true
		}
	}
	return false
}
