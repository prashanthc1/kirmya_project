package domain

import "testing"

// The permission matrix is the module's whole authorization model, so it is
// pinned here rather than left to be re-derived from the map it is built from.
// A permission silently gaining a role is the kind of change that has to fail a
// test, not pass review unnoticed.
func TestRolePermissionMatrix(t *testing.T) {
	cases := []struct {
		role    Role
		granted []Permission
		denied  []Permission
	}{
		{
			role:    RoleCompanyOwner,
			granted: []Permission{PermCompanyDelete, PermCompanyEdit, PermPermissionEdit, PermAuditView, PermReviewModerate},
		},
		{
			role:    RoleOrgAdmin,
			granted: []Permission{PermCompanyEdit, PermBrandingEdit, PermTeamManage, PermRecruiterManage, PermAuditView},
			// Only the owner can delete the company they were given to administer.
			denied: []Permission{PermCompanyDelete},
		},
		{
			role:    RoleRecruiterAdmin,
			granted: []Permission{PermRecruiterManage, PermRecruiterInvite, PermJobPublish, PermApplicationView, PermAnalyticsView},
			// Runs the recruiting team; does not own the company record, its
			// settings, its members' permissions or the audit trail.
			denied: []Permission{PermCompanyEdit, PermBrandingEdit, PermSettingsEdit, PermTeamManage, PermPermissionEdit, PermAuditView, PermCompanyDelete},
		},
		{
			role:    RoleHiringManager,
			granted: []Permission{PermJobCreate, PermJobEdit, PermJobClose, PermApplicationView, PermJobAnalyticsView},
			// Owns requisitions, not the hiring team or the published job.
			denied: []Permission{PermJobPublish, PermRecruiterManage, PermRecruiterInvite, PermTeamManage, PermCompanyEdit, PermAuditView},
		},
		{
			role:    RoleRecruiter,
			granted: []Permission{PermJobView, PermJobCreate, PermJobEdit, PermApplicationView},
			denied:  []Permission{PermJobPublish, PermJobClose, PermAnalyticsView, PermRecruiterManage, PermTeamManage, PermCompanyEdit},
		},
		{
			role:    RoleEmployee,
			granted: []Permission{PermCompanyView},
			// An approved employee association is not a seat in the back office.
			denied: []Permission{PermTeamView, PermJobView, PermAnalyticsView, PermApplicationView, PermCompanyEdit},
		},
		{
			role:    RoleViewer,
			granted: []Permission{PermCompanyView, PermJobView, PermAnalyticsView},
			denied:  []Permission{PermJobCreate, PermApplicationView, PermTeamView, PermCompanyEdit, PermAuditView},
		},
	}

	for _, tc := range cases {
		t.Run(string(tc.role), func(t *testing.T) {
			for _, perm := range tc.granted {
				if !tc.role.Has(perm) {
					t.Errorf("%s should carry %s", tc.role, perm)
				}
			}
			for _, perm := range tc.denied {
				if tc.role.Has(perm) {
					t.Errorf("%s must not carry %s", tc.role, perm)
				}
			}
		})
	}
}

// Every role can see the company it belongs to; nothing below org admin may
// edit it. Stated separately because it is the boundary most easily eroded by
// adding "just one" permission to a mid-tier role.
func TestOnlyAdminRolesEditTheCompany(t *testing.T) {
	for _, role := range AllRoles() {
		if !role.Has(PermCompanyView) {
			t.Errorf("%s cannot view the company it belongs to", role)
		}
		editor := role == RoleCompanyOwner || role == RoleOrgAdmin
		if got := role.Has(PermCompanyEdit); got != editor {
			t.Errorf("%s edit permission = %v, want %v", role, got, editor)
		}
	}
}

// A role string arriving from a request body or a stale database row must not
// be coerced into something valid.
func TestParseRoleRejectsUnknownValues(t *testing.T) {
	for _, valid := range AllRoles() {
		if got, ok := ParseRole(string(valid)); !ok || got != valid {
			t.Errorf("ParseRole(%q) = %q, %v", valid, got, ok)
		}
	}
	if got, ok := ParseRole("  Company_Owner  "); !ok || got != RoleCompanyOwner {
		t.Errorf("ParseRole should trim and lowercase, got %q, %v", got, ok)
	}
	for _, bad := range []string{"", "admin", "superuser", "owner", "company owner", "*"} {
		if role, ok := ParseRole(bad); ok {
			t.Errorf("ParseRole(%q) accepted and returned %q", bad, role)
		}
	}
}

// An unrecognised role must lose every comparison rather than sort above a real
// one, since Rank decides who may act on whom.
func TestUnknownRoleRanksLast(t *testing.T) {
	unknown := Role("root")
	if unknown.Rank() <= RoleViewer.Rank() {
		t.Fatalf("unknown role ranked %d, viewer ranked %d", unknown.Rank(), RoleViewer.Rank())
	}
	if unknown.Has(PermCompanyView) {
		t.Error("an unknown role carries a permission")
	}
}

// Holding two roles gives the union of both, which is the documented behaviour
// for a hiring manager who also recruits.
func TestGrantUnionsItsRoles(t *testing.T) {
	grant := Grant{Roles: []Role{RoleHiringManager, RoleRecruiterAdmin}}

	if !grant.Has(PermRecruiterManage) {
		t.Error("grant lost a permission held through its second role")
	}
	if !grant.Has(PermJobCreate) {
		t.Error("grant lost a permission held through its first role")
	}
	if grant.Has(PermCompanyDelete) {
		t.Error("union produced a permission neither role holds")
	}

	highest, ok := grant.HighestRole()
	if !ok || highest != RoleRecruiterAdmin {
		t.Errorf("HighestRole() = %q, %v; want recruiter_admin", highest, ok)
	}
}

// Extras add to a grant. They are the mechanism behind per-member permissions,
// and they must not be able to subtract or to be confused with a role.
func TestGrantExtrasOnlyAdd(t *testing.T) {
	grant := Grant{Roles: []Role{RoleRecruiter}, Extra: []Permission{PermAnalyticsView}}

	if !grant.Has(PermAnalyticsView) {
		t.Error("extra permission was not honoured")
	}
	if !grant.Has(PermJobView) {
		t.Error("extras removed a permission the role carries")
	}
	if grant.Has(PermAuditView) {
		t.Error("grant carries a permission it was never given")
	}
}

// A user with no relationship to the company holds nothing at all. This is the
// state every cross-company request lands in.
func TestEmptyGrantHoldsNothing(t *testing.T) {
	var grant Grant

	if _, ok := grant.HighestRole(); ok {
		t.Error("an empty grant reported a role")
	}
	for _, perm := range []Permission{PermCompanyView, PermTeamView, PermJobView, PermAnalyticsView} {
		if grant.Has(perm) {
			t.Errorf("an empty grant carries %s", perm)
		}
	}
	if grant.CanAssign(RoleViewer) {
		t.Error("an empty grant could assign a role")
	}
}

// Privilege escalation is the failure this module most has to survive: nobody
// may hand out a role at or above their own, and ownership moves only by the
// owner's hand.
func TestCanAssignBlocksEscalation(t *testing.T) {
	cases := []struct {
		name   string
		actor  Role
		target Role
		want   bool
	}{
		{"owner hands over ownership", RoleCompanyOwner, RoleOrgAdmin, true},
		{"owner appoints an owner", RoleCompanyOwner, RoleCompanyOwner, true},
		{"org admin appoints an owner", RoleOrgAdmin, RoleCompanyOwner, false},
		{"org admin appoints a peer", RoleOrgAdmin, RoleOrgAdmin, false},
		{"org admin appoints below", RoleOrgAdmin, RoleRecruiterAdmin, true},
		{"recruiter admin promotes to org admin", RoleRecruiterAdmin, RoleOrgAdmin, false},
		{"recruiter admin promotes itself", RoleRecruiterAdmin, RoleRecruiterAdmin, false},
		{"recruiter admin appoints a recruiter", RoleRecruiterAdmin, RoleRecruiter, true},
		{"hiring manager appoints anyone", RoleHiringManager, RoleRecruiter, false},
		{"recruiter appoints anyone", RoleRecruiter, RoleViewer, false},
		{"employee appoints anyone", RoleEmployee, RoleViewer, false},
		{"viewer appoints anyone", RoleViewer, RoleViewer, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			grant := Grant{Roles: []Role{tc.actor}}
			if got := grant.CanAssign(tc.target); got != tc.want {
				t.Errorf("Grant{%s}.CanAssign(%s) = %v, want %v", tc.actor, tc.target, got, tc.want)
			}
		})
	}
}

// An extra permission is not a promotion. Granting someone team:manage
// individually lets them manage the team; it does not let them mint roles at
// their own level, because CanAssign still measures against their highest role.
func TestExtraPermissionDoesNotRaiseAssignmentCeiling(t *testing.T) {
	grant := Grant{Roles: []Role{RoleRecruiter}, Extra: []Permission{PermTeamManage}}

	if grant.CanAssign(RoleRecruiter) {
		t.Error("a recruiter with team:manage could appoint a peer")
	}
	if grant.CanAssign(RoleOrgAdmin) {
		t.Error("a recruiter with team:manage could appoint an org admin")
	}
	if !grant.CanAssign(RoleViewer) {
		t.Error("a recruiter with team:manage could not appoint below itself")
	}
	if grant.CanAssign(RoleCompanyOwner) {
		t.Error("a recruiter with team:manage could appoint an owner")
	}
}

// Assignment requires a management permission in the first place, so a role
// that ranks high but manages nothing cannot hand out roles.
func TestCanAssignRequiresManagementPermission(t *testing.T) {
	if (Grant{Roles: []Role{RoleHiringManager}}).CanAssign(RoleViewer) {
		t.Error("hiring manager holds neither team:manage nor recruiter:manage yet could assign")
	}
	if !(Grant{Roles: []Role{RoleRecruiterAdmin}}).CanAssign(RoleRecruiter) {
		t.Error("recruiter admin holds recruiter:manage and should assign below itself")
	}
}
