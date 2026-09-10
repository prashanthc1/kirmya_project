package domain

import (
	"testing"
)

/*
The reconciliation rule.

Everything here is about one property: an assignment can only narrow. The rule
is deployed into a product where every administrator has no assignment, so the
no-assignment case has to be exactly today's behaviour, and every other case has
to be a subset of it.
*/

// The safety property the whole design rests on.
func TestNoAssignmentHoldsEveryPermission(t *testing.T) {
	effective := EffectivePermissions(nil)
	if len(effective) != len(AllPermissions()) {
		t.Fatalf("no assignment yields %d permissions, want all %d",
			len(effective), len(AllPermissions()))
	}
	for _, perm := range AllPermissions() {
		if !HasPermission(effective, perm) {
			t.Errorf("no assignment is missing %q; an administrator with no role would lose access they have today", perm)
		}
	}
}

// No arrangement of roles grants more than assigning none. This is what makes
// the change safe to deploy: there is no way to use it to widen anybody.
func TestNoAssignmentIsAlwaysTheWidestAnswer(t *testing.T) {
	unassigned := EffectivePermissions(nil)

	// Every role alone, and all of them together.
	combinations := [][]string{}
	for _, code := range RoleCodes() {
		combinations = append(combinations, []string{code})
	}
	combinations = append(combinations, RoleCodes())

	for _, roles := range combinations {
		effective := EffectivePermissions(roles)
		if len(effective) > len(unassigned) {
			t.Errorf("roles %v yield %d permissions, more than the %d of no assignment",
				roles, len(effective), len(unassigned))
		}
		for _, perm := range effective {
			if !HasPermission(unassigned, perm) {
				t.Errorf("roles %v grant %q, which no assignment does not - an assignment widened access", roles, perm)
			}
		}
	}
}

// super_admin is the only seeded role that keeps everything.
func TestSuperAdminKeepsEverythingAndOthersDoNot(t *testing.T) {
	if got := len(EffectivePermissions([]string{RoleSuperAdmin})); got != len(AllPermissions()) {
		t.Errorf("super_admin has %d permissions, want all %d", got, len(AllPermissions()))
	}
	for _, code := range RoleCodes() {
		if code == RoleSuperAdmin {
			continue
		}
		if len(EffectivePermissions([]string{code})) >= len(AllPermissions()) {
			t.Errorf("%s holds every permission; only super_admin should", code)
		}
	}
}

// The two permissions that let an administrator become someone else or grant
// themselves more belong to super_admin alone.
func TestOnlySuperAdminMayAssignRolesOrImpersonate(t *testing.T) {
	for _, guarded := range []string{PermRolesManage, PermUsersImpersonate} {
		for _, code := range RoleCodes() {
			if code == RoleSuperAdmin {
				continue
			}
			// support_admin is deliberately allowed to impersonate: that is the
			// job. Nothing but super_admin may assign roles.
			if guarded == PermUsersImpersonate && code == RoleSupportAdmin {
				continue
			}
			if HasPermission(EffectivePermissions([]string{code}), guarded) {
				t.Errorf("%s holds %q", code, guarded)
			}
		}
	}
}

// An unknown code carries nothing rather than everything. If a stored
// assignment ever names a role the code does not know, the account is narrowed
// to nothing, not widened to all.
func TestUnknownRoleCarriesNothing(t *testing.T) {
	if perms := EffectivePermissions([]string{"not_a_role"}); len(perms) != 0 {
		t.Errorf("unknown role yields %v, want nothing", perms)
	}
	if _, known := PermissionsForRole("not_a_role"); known {
		t.Error("PermissionsForRole reports an unknown role as known")
	}

	// And it does not rescue a real narrowing into the no-assignment case.
	withReal := EffectivePermissions([]string{RoleReadOnlyAdmin, "not_a_role"})
	if len(withReal) != len(EffectivePermissions([]string{RoleReadOnlyAdmin})) {
		t.Error("an unknown role changed what a real one carries")
	}
	if HasPermission(withReal, PermRolesManage) {
		t.Error("an unknown role alongside a real one granted roles.manage")
	}
}

// Several roles union, so two narrow roles are still narrow.
func TestSeveralRolesUnionWithoutDuplicates(t *testing.T) {
	effective := EffectivePermissions([]string{RoleAnalyticsAdmin, RoleOperationsAdmin})

	if !HasPermission(effective, PermAnalyticsRead) {
		t.Error("lost analytics.read from analytics_admin")
	}
	if !HasPermission(effective, PermMaintenanceManage) {
		t.Error("lost maintenance.manage from operations_admin")
	}
	if HasPermission(effective, PermUsersImpersonate) {
		t.Error("gained users.impersonate from two roles that carry neither")
	}

	seen := map[string]int{}
	for _, perm := range effective {
		seen[perm]++
		if seen[perm] > 1 {
			t.Errorf("%q appears %d times", perm, seen[perm])
		}
	}
}

// read_only_admin is derived, so it can change nothing whatever is added later.
func TestReadOnlyAdminChangesNothing(t *testing.T) {
	effective := EffectivePermissions([]string{RoleReadOnlyAdmin})
	if len(effective) == 0 {
		t.Fatal("read_only_admin holds nothing at all")
	}
	for _, perm := range effective {
		if len(perm) < 5 || perm[len(perm)-5:] != ".read" {
			t.Errorf("read_only_admin holds %q, which is not a read", perm)
		}
	}
}
