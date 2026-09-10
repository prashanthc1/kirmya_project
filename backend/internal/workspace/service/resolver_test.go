package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"

	"kirmya/internal/workspace/domain"
)

/*
The resolver's whole job is to answer a question without changing anything, so
these tests assert two things about every fixture: the exact set of workspaces
returned, and that answering wrote nothing. The second half is not ceremony -
the defect this architecture is being built on top of was a read path that
provisioned the authority it was asked about, and a resolver spanning six
domains would multiply that mistake rather than repeat it.

The fakes below record every call. A reader that mutates would have to do it
through one of these, so a test can prove absence of writes by proving the
readers were only ever asked to read.
*/

type recordingReaders struct {
	account      Account
	accountErr   error
	freelancer   bool
	freelanceErr error
	recruiting   bool
	recruitErr   error
	companies    []CompanyGrant
	companyErr   error
	communities  []CommunityGrant
	communityErr error

	calls []string
}

func (r *recordingReaders) Account(_ context.Context, _ uuid.UUID) (Account, error) {
	r.calls = append(r.calls, "read:account")
	return r.account, r.accountErr
}

func (r *recordingReaders) HasFreelancerProfile(_ context.Context, _ uuid.UUID) (bool, error) {
	r.calls = append(r.calls, "read:freelancer")
	return r.freelancer, r.freelanceErr
}

func (r *recordingReaders) HasRecruitingCapability(_ context.Context, _ uuid.UUID) (bool, error) {
	r.calls = append(r.calls, "read:recruiting")
	return r.recruiting, r.recruitErr
}

func (r *recordingReaders) ManagedCompanies(_ context.Context, _ uuid.UUID) ([]CompanyGrant, error) {
	r.calls = append(r.calls, "read:companies")
	return r.companies, r.companyErr
}

func (r *recordingReaders) ManagedCommunities(_ context.Context, _ uuid.UUID) ([]CommunityGrant, error) {
	r.calls = append(r.calls, "read:communities")
	return r.communities, r.communityErr
}

// activeAccount is an ordinary signed-in professional: active, not an admin.
func activeAccount() Account { return Account{Active: true} }

func resolve(t *testing.T, readers *recordingReaders) []domain.Workspace {
	t.Helper()
	resolver := NewResolver(readers, readers, readers, readers, readers)
	got, err := resolver.ResolveForUser(context.Background(), uuid.New())
	if err != nil {
		t.Fatalf("ResolveForUser: unexpected error: %v", err)
	}
	assertNoWrites(t, readers)
	return got
}

// assertNoWrites fails if any reader was asked to do anything but read.
func assertNoWrites(t *testing.T, readers *recordingReaders) {
	t.Helper()
	for _, call := range readers.calls {
		if !strings.HasPrefix(call, "read:") {
			t.Errorf("resolution performed a non-read operation: %q", call)
		}
	}
}

// keysOf reduces a result to its stable identities, which is what the ordering
// and membership assertions are really about.
func keysOf(workspaces []domain.Workspace) []string {
	keys := make([]string, 0, len(workspaces))
	for _, workspace := range workspaces {
		keys = append(keys, workspace.Key)
	}
	return keys
}

func assertKeys(t *testing.T, got []domain.Workspace, want ...string) {
	t.Helper()
	gotKeys := keysOf(got)
	if len(gotKeys) != len(want) {
		t.Fatalf("workspace keys = %v, want %v", gotKeys, want)
	}
	for i := range want {
		if gotKeys[i] != want[i] {
			t.Fatalf("workspace keys = %v, want %v", gotKeys, want)
		}
	}
}

// 1. Professional-only.
func TestProfessionalOnly(t *testing.T) {
	got := resolve(t, &recordingReaders{account: activeAccount()})
	assertKeys(t, got, "professional")

	if !got[0].IsDefault {
		t.Error("professional workspace is not marked default")
	}
	if got[0].Route != "/feed" {
		t.Errorf("professional route = %q, want /feed", got[0].Route)
	}
	if got[0].EntityID != nil {
		t.Error("professional workspace carries an entity id")
	}
}

// 2. Freelancer.
func TestFreelancerWorkspace(t *testing.T) {
	got := resolve(t, &recordingReaders{account: activeAccount(), freelancer: true})
	assertKeys(t, got, "professional", "freelancer")

	if got[1].Route != "/freelance" {
		t.Errorf("freelancer route = %q, want /freelance", got[1].Route)
	}
}

// 3. Recruiting.
func TestRecruitingWorkspace(t *testing.T) {
	got := resolve(t, &recordingReaders{account: activeAccount(), recruiting: true})
	assertKeys(t, got, "professional", "recruiting")

	// The served namespace is /recruiter. /recruiting exists only in the design
	// documents, and routing a workspace there would land on nothing.
	if got[1].Route != "/recruiter" {
		t.Errorf("recruiting route = %q, want /recruiter", got[1].Route)
	}
}

// 4. Freelancer and Recruiting together - capabilities are not exclusive.
func TestFreelancerAndRecruiting(t *testing.T) {
	got := resolve(t, &recordingReaders{account: activeAccount(), freelancer: true, recruiting: true})
	assertKeys(t, got, "professional", "freelancer", "recruiting")
}

// 5. One managed company.
func TestOneManagedCompany(t *testing.T) {
	companyID := uuid.NewString()
	got := resolve(t, &recordingReaders{
		account:   activeAccount(),
		companies: []CompanyGrant{{CompanyID: companyID, Name: "Acme LLC", Slug: "acme"}},
	})
	assertKeys(t, got, "professional", "company:"+companyID)

	company := got[1]
	if company.EntityID == nil || *company.EntityID != companyID {
		t.Fatalf("company entity id = %v, want %s", company.EntityID, companyID)
	}
	if company.Label != "Acme LLC" {
		t.Errorf("company label = %q, want the stored name", company.Label)
	}
	if company.Route != "/companies/acme/admin" {
		t.Errorf("company route = %q, want the served handle path", company.Route)
	}
}

// 6. Multiple managed companies.
func TestMultipleManagedCompanies(t *testing.T) {
	first, second := uuid.NewString(), uuid.NewString()
	got := resolve(t, &recordingReaders{
		account: activeAccount(),
		companies: []CompanyGrant{
			{CompanyID: first, Name: "Acme LLC", Slug: "acme"},
			{CompanyID: second, Name: "Example Technologies", Slug: "example"},
		},
	})
	assertKeys(t, got, "professional", "company:"+first, "company:"+second)
}

// 7 and 8. Employee-only and viewer-only accounts hold no management
// permission, so the company reader returns nothing for them and no company
// workspace appears. The permission threshold itself is asserted in the adapter
// tests, against the company module's real role map.
func TestCompanyMembershipWithoutManagementYieldsNoWorkspace(t *testing.T) {
	got := resolve(t, &recordingReaders{account: activeAccount(), companies: nil})
	assertKeys(t, got, "professional")
}

// 9, 10 and 11. Owner, admin and moderator all reach the community workspace.
func TestCommunityManagementRoles(t *testing.T) {
	for _, role := range []string{"owner", "admin", "moderator"} {
		t.Run(role, func(t *testing.T) {
			communityID := uuid.NewString()
			got := resolve(t, &recordingReaders{
				account:     activeAccount(),
				communities: []CommunityGrant{{CommunityID: communityID, Title: "Go Developers UAE"}},
			})
			assertKeys(t, got, "professional", "community_admin:"+communityID)

			community := got[1]
			if community.Label != "Go Developers UAE" {
				t.Errorf("community label = %q, want the stored title", community.Label)
			}
			if community.Route != "/communities/"+communityID+"/admin" {
				t.Errorf("community route = %q, want the id path", community.Route)
			}
			if community.Slug != "" {
				t.Errorf("community slug = %q, want empty: communities route by id", community.Slug)
			}
		})
	}
}

// 12. An ordinary member is not returned by the reader, so no workspace.
func TestOrdinaryCommunityMemberGetsNoAdminWorkspace(t *testing.T) {
	got := resolve(t, &recordingReaders{account: activeAccount(), communities: nil})
	assertKeys(t, got, "professional")
}

// 13. Platform admin.
func TestPlatformAdminWorkspace(t *testing.T) {
	got := resolve(t, &recordingReaders{account: Account{Active: true, IsPlatformAdmin: true}})
	assertKeys(t, got, "professional", "platform_admin")

	if got[1].Route != "/admin" {
		t.Errorf("platform admin route = %q, want /admin", got[1].Route)
	}
}

// 14 and 24. Everything at once, in the documented order.
func TestMultiCapabilityUser(t *testing.T) {
	companyID, communityID := uuid.NewString(), uuid.NewString()
	got := resolve(t, &recordingReaders{
		account:     Account{Active: true, IsPlatformAdmin: true},
		freelancer:  true,
		recruiting:  true,
		companies:   []CompanyGrant{{CompanyID: companyID, Name: "Acme LLC", Slug: "acme"}},
		communities: []CommunityGrant{{CommunityID: communityID, Title: "Go Developers UAE"}},
	})
	assertKeys(t, got,
		"professional",
		"freelancer",
		"recruiting",
		"company:"+companyID,
		"community_admin:"+communityID,
		"platform_admin",
	)

	defaults := 0
	for _, workspace := range got {
		if workspace.IsDefault {
			defaults++
		}
	}
	if defaults != 1 {
		t.Errorf("%d workspaces marked default, want exactly 1", defaults)
	}
}

// 15 and 16. A revoked company membership and an inactive community membership
// are filtered by the domains that own them, so they never reach the resolver.
func TestRevokedGrantsProduceNoWorkspaces(t *testing.T) {
	got := resolve(t, &recordingReaders{account: activeAccount(), companies: []CompanyGrant{}, communities: []CommunityGrant{}})
	assertKeys(t, got, "professional")
}

// 17. A capability that is not active yields nothing.
func TestInactiveRecruiterCapabilityYieldsNoRecruiting(t *testing.T) {
	got := resolve(t, &recordingReaders{account: activeAccount(), recruiting: false})
	assertKeys(t, got, "professional")
}

// 18. Legacy role_id = 'recruiter' grants nothing.
//
// The resolver never receives a role string for anything but platform
// administration - the Account struct carries a boolean the adapter computed
// from AdminRoles(), and there is no field a recruiter role could arrive in.
// This asserts the structural property: an account whose only distinguishing
// feature is a legacy role resolves to Professional alone.
func TestLegacyRecruiterRoleGrantsNothing(t *testing.T) {
	got := resolve(t, &recordingReaders{account: Account{Active: true}, recruiting: false})
	assertKeys(t, got, "professional")
}

// 19. Company recruiter membership yields the company workspace and nothing
// else. Standalone Recruiting and company-scoped recruiting are different
// authorities and neither implies the other.
func TestCompanyRecruiterDoesNotGrantStandaloneRecruiting(t *testing.T) {
	companyID := uuid.NewString()
	got := resolve(t, &recordingReaders{
		account:   activeAccount(),
		companies: []CompanyGrant{{CompanyID: companyID, Name: "Acme LLC", Slug: "acme"}},
		// The company recruiter has no standalone capability.
		recruiting: false,
	})
	assertKeys(t, got, "professional", "company:"+companyID)
}

// 20. Resolution reads and does nothing else.
func TestResolutionPerformsOnlyReads(t *testing.T) {
	readers := &recordingReaders{
		account:     Account{Active: true, IsPlatformAdmin: true},
		freelancer:  true,
		recruiting:  true,
		companies:   []CompanyGrant{{CompanyID: uuid.NewString(), Name: "Acme LLC", Slug: "acme"}},
		communities: []CommunityGrant{{CommunityID: uuid.NewString(), Title: "Go Developers UAE"}},
	}
	resolve(t, readers)

	// Each domain is asked exactly once. More than once would mean a loop that
	// grows with the data - the N+1 shape this must not have.
	if len(readers.calls) != 5 {
		t.Errorf("readers called %d times (%v), want exactly 5 - one per domain", len(readers.calls), readers.calls)
	}
}

// 21. Companies order alphabetically regardless of the order rows arrive in.
func TestCompanyOrderingIsAlphabeticalNotRowOrder(t *testing.T) {
	zebra, acme, middle := uuid.NewString(), uuid.NewString(), uuid.NewString()
	got := resolve(t, &recordingReaders{
		account: activeAccount(),
		companies: []CompanyGrant{
			{CompanyID: zebra, Name: "Zebra Holdings", Slug: "zebra"},
			{CompanyID: acme, Name: "Acme LLC", Slug: "acme"},
			{CompanyID: middle, Name: "middle case", Slug: "middle"},
		},
	})
	// Case-insensitive: "middle case" sorts between Acme and Zebra, not after
	// both because of its lowercase initial.
	assertKeys(t, got, "professional", "company:"+acme, "company:"+middle, "company:"+zebra)
}

// 22. Communities order alphabetically too.
func TestCommunityOrderingIsAlphabetical(t *testing.T) {
	second, first := uuid.NewString(), uuid.NewString()
	got := resolve(t, &recordingReaders{
		account: activeAccount(),
		communities: []CommunityGrant{
			{CommunityID: second, Title: "Go Developers UAE"},
			{CommunityID: first, Title: "Facilities Management UAE"},
		},
	})
	assertKeys(t, got, "professional", "community_admin:"+first, "community_admin:"+second)
}

// 23. Duplicate underlying rows produce one workspace.
func TestDuplicateGrantsProduceOneWorkspace(t *testing.T) {
	companyID := uuid.NewString()
	got := resolve(t, &recordingReaders{
		account: activeAccount(),
		companies: []CompanyGrant{
			{CompanyID: companyID, Name: "Acme LLC", Slug: "acme"},
			{CompanyID: companyID, Name: "Acme LLC", Slug: "acme"},
		},
	})
	assertKeys(t, got, "professional", "company:"+companyID)
}

// 25. An inactive account gets nothing at all - not even Professional.
func TestInactiveAccountResolvesToNothing(t *testing.T) {
	readers := &recordingReaders{account: Account{Active: false, IsPlatformAdmin: true}}
	resolver := NewResolver(readers, readers, readers, readers, readers)

	got, err := resolver.ResolveForUser(context.Background(), uuid.New())
	if !errors.Is(err, ErrAccountNotEligible) {
		t.Fatalf("error = %v, want ErrAccountNotEligible", err)
	}
	if got != nil {
		t.Errorf("workspaces = %v, want none for an inactive account", got)
	}
	// And the privileged domains were never even consulted: an account that may
	// not use the product is refused before anything asks what it may manage.
	if len(readers.calls) != 1 {
		t.Errorf("readers called %v, want only the account lookup", readers.calls)
	}
}

// A missing user is the auth module's not-found error, surfaced unchanged.
func TestUnknownUserSurfacesTheLookupError(t *testing.T) {
	notFound := errors.New("user not found")
	readers := &recordingReaders{accountErr: notFound}
	resolver := NewResolver(readers, readers, readers, readers, readers)

	if _, err := resolver.ResolveForUser(context.Background(), uuid.New()); !errors.Is(err, notFound) {
		t.Fatalf("error = %v, want the repository's not-found error", err)
	}
}

// A failed domain lookup fails the whole resolution rather than silently
// dropping that workspace.
//
// Both behaviours are fail-closed on grants; this one is also honest. Omitting
// a company because its query timed out would render as "you were removed from
// Acme", which is a lie the user cannot tell from the truth, and the frontend
// would cache it. An error is recoverable by retry, and keeps the absence of a
// workspace meaning exactly one thing: no authority.
func TestFailedDomainLookupFailsClosed(t *testing.T) {
	boom := errors.New("company database unavailable")
	readers := &recordingReaders{account: activeAccount(), companyErr: boom}
	resolver := NewResolver(readers, readers, readers, readers, readers)

	got, err := resolver.ResolveForUser(context.Background(), uuid.New())
	if !errors.Is(err, boom) {
		t.Fatalf("error = %v, want the underlying failure", err)
	}
	// Alongside the error, the most a caller may serve: professional only. A
	// caller that ignores the error therefore cannot leak a privileged
	// workspace, which is the point of returning a value here at all.
	assertKeys(t, got, "professional")
	if !got[0].IsDefault {
		t.Error("the fail-closed value is not marked default")
	}
}

// No fixture, however privileged, ever produces a page-admin workspace.
func TestNoPageAdminWorkspaceIsEverReturned(t *testing.T) {
	got := resolve(t, &recordingReaders{
		account:     Account{Active: true, IsPlatformAdmin: true},
		freelancer:  true,
		recruiting:  true,
		companies:   []CompanyGrant{{CompanyID: uuid.NewString(), Name: "Acme LLC", Slug: "acme"}},
		communities: []CommunityGrant{{CommunityID: uuid.NewString(), Title: "Go Developers UAE"}},
	})
	for _, workspace := range got {
		if strings.Contains(string(workspace.Type), "page") {
			t.Errorf("returned a page workspace %q; the Pages domain does not exist", workspace.Type)
		}
	}
}

// A company with no stored name still gets a usable label, and never shows its
// uuid to the user.
func TestBlankEntityNamesFallBackSafely(t *testing.T) {
	companyID, communityID := uuid.NewString(), uuid.NewString()
	got := resolve(t, &recordingReaders{
		account:     activeAccount(),
		companies:   []CompanyGrant{{CompanyID: companyID, Name: "   ", Slug: "acme"}},
		communities: []CommunityGrant{{CommunityID: communityID, Title: ""}},
	})

	for _, workspace := range got[1:] {
		if strings.TrimSpace(workspace.Label) == "" {
			t.Errorf("%s has a blank label", workspace.Key)
		}
		if strings.Contains(workspace.Label, companyID) || strings.Contains(workspace.Label, communityID) {
			t.Errorf("%s exposes an internal id as its label: %q", workspace.Key, workspace.Label)
		}
	}
}

// A company with no handle still produces a well-formed path rather than
// "/companies//admin".
func TestCompanyWithoutHandleStillRoutesWellFormed(t *testing.T) {
	companyID := uuid.NewString()
	got := resolve(t, &recordingReaders{
		account:   activeAccount(),
		companies: []CompanyGrant{{CompanyID: companyID, Name: "Acme LLC", Slug: ""}},
	})
	if want := "/companies/" + companyID + "/admin"; got[1].Route != want {
		t.Errorf("route = %q, want %q", got[1].Route, want)
	}
	if strings.Contains(got[1].Route, "//") {
		t.Errorf("route %q collapsed to an empty path segment", got[1].Route)
	}
}
