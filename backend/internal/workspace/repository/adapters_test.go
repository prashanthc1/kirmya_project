package repository

import (
	"testing"

	"kirmya/internal/community/models"
	companyDomain "kirmya/internal/company/domain"
)

/*
These assert the threshold that decides whether a company relationship is a
workspace, against the company module's real role map rather than a copy of it.
If someone adds a permission to RoleEmployee, this test fails - which is the
point: the line between "member of a company" and "manages a company" is a
product decision, and it should not move silently.
*/

func TestCompanyManagementThresholdMatchesTheRoleMap(t *testing.T) {
	cases := []struct {
		role          companyDomain.Role
		wantWorkspace bool
		why           string
	}{
		{companyDomain.RoleCompanyOwner, true, "owns the company"},
		{companyDomain.RoleOrgAdmin, true, "administers everything short of ownership"},
		{companyDomain.RoleRecruiterAdmin, true, "manages the recruiting team and hiring data"},
		{companyDomain.RoleHiringManager, true, "owns requisitions and sees the funnel"},
		{companyDomain.RoleRecruiter, true, "creates jobs and reads applications"},
		{companyDomain.RoleEmployee, false, "holds company:view alone - an association, not authority"},
		{companyDomain.RoleViewer, false, "reads a private dashboard; reading is not managing"},
	}

	for _, tc := range cases {
		t.Run(string(tc.role), func(t *testing.T) {
			grant := companyDomain.Grant{Roles: []companyDomain.Role{tc.role}}
			if got := managesCompany(grant); got != tc.wantWorkspace {
				t.Errorf("managesCompany(%s) = %v, want %v - %s", tc.role, got, tc.wantWorkspace, tc.why)
			}
		})
	}
}

// An empty grant is the normal answer for a user with no relationship to a
// company, and it must not be a workspace.
func TestEmptyCompanyGrantIsNotAWorkspace(t *testing.T) {
	if managesCompany(companyDomain.Grant{}) {
		t.Error("an empty grant produced a company workspace")
	}
}

// Individually granted extras can lift a member over the threshold, because the
// company module treats extras as real permissions. A viewer given job:publish
// is publishing jobs, whatever their role says.
func TestExtraPermissionsCanReachTheThreshold(t *testing.T) {
	grant := companyDomain.Grant{
		Roles: []companyDomain.Role{companyDomain.RoleViewer},
		Extra: []companyDomain.Permission{companyDomain.PermJobPublish},
	}
	if !managesCompany(grant) {
		t.Error("a viewer holding job:publish did not reach the company workspace")
	}
}

// Every permission in the threshold set must be one the company module actually
// defines. A typo would silently never match, quietly narrowing access in a way
// no test of the roles above would catch.
func TestThresholdPermissionsAreRealAndDiscriminating(t *testing.T) {
	for _, perm := range managementPermissions {
		holder := companyDomain.Grant{Extra: []companyDomain.Permission{perm}}
		if !managesCompany(holder) {
			t.Errorf("%q is in the threshold set but grants nothing", perm)
		}
		// And it must be a permission some real role carries, otherwise it is a
		// string that can never arrive from the database.
		carried := false
		for _, role := range companyDomain.AllRoles() {
			if role.Has(perm) {
				carried = true
				break
			}
		}
		if !carried {
			t.Errorf("%q is in the threshold set but no role carries it - likely a typo", perm)
		}
	}
}

// The community side of the threshold, asserted against the membership rule the
// community service itself uses.
func TestCommunityManagementThreshold(t *testing.T) {
	cases := []struct {
		role   string
		status string
		want   bool
	}{
		{models.CommunityRoleOwner, models.MemberStatusActive, true},
		{models.CommunityRoleAdmin, models.MemberStatusActive, true},
		{models.CommunityRoleModerator, models.MemberStatusActive, true},
		{models.CommunityRoleMember, models.MemberStatusActive, false},
		// Status is checked before role, so a banned owner is not an owner.
		{models.CommunityRoleOwner, "banned", false},
		{models.CommunityRoleAdmin, "pending", false},
		{models.CommunityRoleModerator, "removed", false},
	}

	for _, tc := range cases {
		member := &models.CommunityMember{RoleName: tc.role, Status: tc.status}
		if got := member.CanModerate(); got != tc.want {
			t.Errorf("CanModerate(role=%s status=%s) = %v, want %v", tc.role, tc.status, got, tc.want)
		}
	}
}
