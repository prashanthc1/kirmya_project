//go:build ciintegration

package ci

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	authRepo "kirmya/internal/auth/repository"
	communityRepo "kirmya/internal/community/repository"
	companyRepo "kirmya/internal/company/repository"
	freelanceRepo "kirmya/internal/freelance/repository"
	recruiterRepo "kirmya/internal/recruiter/repository"
	recruiterService "kirmya/internal/recruiter/service"
	workspaceDomain "kirmya/internal/workspace/domain"
	workspaceRepo "kirmya/internal/workspace/repository"
	workspaceService "kirmya/internal/workspace/service"
)

/*
The workspace resolver against real SQL.

The unit tests in internal/workspace prove the resolver's behaviour given
answers; these prove the answers, which is where the interesting mistakes live.
A status filter that is right in Go and wrong in the WHERE clause passes every
in-memory test and still hands a revoked member the company they were removed
from.

The resolver is not served over HTTP yet, so these drive it in-process against
the same database the API uses. That is deliberate: this slice exists to prove
the domain resolver independently of the bootstrap path it will later feed.
*/

func newResolver(t *testing.T, pool *pgxpool.Pool) *workspaceService.Resolver {
	t.Helper()
	return workspaceService.NewResolver(
		workspaceRepo.NewAccountAdapter(authRepo.NewAuthRepository(pool)),
		workspaceRepo.NewFreelancerAdapter(freelanceRepo.NewFreelanceRepository(pool)),
		workspaceRepo.NewRecruiterAdapter(recruiterService.NewRecruiterService(recruiterRepo.NewRecruiterRepository(pool))),
		workspaceRepo.NewCompanyAdapter(companyRepo.NewManagementRepository(pool)),
		workspaceRepo.NewCommunityAdapter(communityRepo.NewCommunityRepository(pool)),
	)
}

// seedUser inserts a disposable account directly, so a test can set role_id and
// status to values registration would never produce.
func seedUser(t *testing.T, pool *pgxpool.Pool, roleID, status string) uuid.UUID {
	t.Helper()
	id := uuid.New()
	email := fmt.Sprintf("ci-ws-%s@example.invalid", id)
	if _, err := pool.Exec(t.Context(), `
		INSERT INTO users (id, uuid, first_name, last_name, email, password_hash, email_verified, role_id, status, created_at, updated_at)
		VALUES ($1, $1, 'Workspace', 'Fixture', $2, 'x', true, $3, $4, NOW(), NOW())`,
		id, email, roleID, status); err != nil {
		t.Fatalf("seeding user: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM users WHERE id = $1`, id)
	})
	return id
}

// seedCompany inserts a company owned by nobody in particular, so membership is
// the only thing under test.
func seedWorkspaceCompany(t *testing.T, pool *pgxpool.Pool, name string) (uuid.UUID, string) {
	t.Helper()
	id := uuid.New()
	handle := "ci-ws-" + strings.Split(id.String(), "-")[0]
	owner := seedUser(t, pool, "user", "active")
	if _, err := pool.Exec(t.Context(), `
		INSERT INTO companies (id, name, handle, status, owner_id, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, 'active', $4, $4, NOW(), NOW())`, id, name, handle, owner); err != nil {
		t.Fatalf("seeding company: %v", err)
	}
	if _, err := pool.Exec(t.Context(), `
		INSERT INTO company_profiles (company_id) VALUES ($1) ON CONFLICT DO NOTHING`, id); err != nil {
		t.Fatalf("seeding company profile: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM companies WHERE id = $1`, id)
	})
	return id, handle
}

func addCompanyMember(t *testing.T, pool *pgxpool.Pool, companyID, userID uuid.UUID, role, status string) {
	t.Helper()
	if _, err := pool.Exec(t.Context(), `
		INSERT INTO company_members (id, company_id, user_id, role, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
		uuid.New(), companyID, userID, role, status); err != nil {
		t.Fatalf("seeding company membership: %v", err)
	}
}

func seedCommunity(t *testing.T, pool *pgxpool.Pool, title string) uuid.UUID {
	t.Helper()
	id := uuid.New()
	owner := seedUser(t, pool, "user", "active")
	if _, err := pool.Exec(t.Context(), `
		INSERT INTO communities (id, title, description, category, visibility, is_private, owner_id, created_at, updated_at)
		VALUES ($1, $2, 'Disposable workspace fixture', 'Engineering', 'public', false, $3, NOW(), NOW())`,
		id, title, owner); err != nil {
		t.Fatalf("seeding community: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM communities WHERE id = $1`, id)
	})
	return id
}

func addCommunityMember(t *testing.T, pool *pgxpool.Pool, communityID, userID uuid.UUID, role, status string) {
	t.Helper()
	if _, err := pool.Exec(t.Context(), `
		INSERT INTO community_members (id, community_id, user_id, role_name, status, joined_at, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
		uuid.New(), communityID, userID, role, status); err != nil {
		t.Fatalf("seeding community membership: %v", err)
	}
}

func seedFreelancerProfile(t *testing.T, pool *pgxpool.Pool, userID uuid.UUID) {
	t.Helper()
	if _, err := pool.Exec(t.Context(), `
		INSERT INTO freelancer_profiles (id, user_id, hourly_rate, tagline, skills, portfolio_links, availability_status, created_at, updated_at)
		VALUES ($1, $2, 100, 'Fixture', '[]'::jsonb, '[]'::jsonb, 'available', NOW(), NOW())`,
		uuid.New(), userID); err != nil {
		t.Fatalf("seeding freelancer profile: %v", err)
	}
}

// seedRecruiterCapability creates a recruiter profile in the given lifecycle
// state, which is the only thing that makes the Recruiting workspace appear.
func seedRecruiterCapability(t *testing.T, pool *pgxpool.Pool, userID uuid.UUID, status string) {
	t.Helper()
	if _, err := pool.Exec(t.Context(), `
		INSERT INTO recruiter_profiles (id, user_id, company_name, verified, capability_status, created_at)
		VALUES ($1, $2, 'Workspace Fixture Co', false, $3, NOW())`,
		uuid.New(), userID, status); err != nil {
		t.Fatalf("seeding recruiter capability: %v", err)
	}
}

func resolveKeys(t *testing.T, pool *pgxpool.Pool, userID uuid.UUID) []string {
	t.Helper()
	got, err := newResolver(t, pool).ResolveForUser(t.Context(), userID)
	if err != nil {
		t.Fatalf("ResolveForUser: %v", err)
	}
	keys := make([]string, 0, len(got))
	for _, workspace := range got {
		keys = append(keys, workspace.Key)
	}
	return keys
}

func assertResolved(t *testing.T, got []string, want ...string) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("workspaces = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("workspaces = %v, want %v", got, want)
		}
	}
}

// An ordinary account resolves to Professional alone against a real database.
func TestWorkspaceProfessionalOnlyAgainstPostgres(t *testing.T) {
	pool := connectDB(t)
	user := seedUser(t, pool, "user", "active")
	assertResolved(t, resolveKeys(t, pool, user), "professional")
}

// Freelancer eligibility is a real row, not the fabricated profile
// GetProfileByUserID hands back for everyone.
func TestWorkspaceFreelancerEligibility(t *testing.T) {
	pool := connectDB(t)

	without := seedUser(t, pool, "user", "active")
	assertResolved(t, resolveKeys(t, pool, without), "professional")

	with := seedUser(t, pool, "user", "active")
	seedFreelancerProfile(t, pool, with)
	assertResolved(t, resolveKeys(t, pool, with), "professional", "freelancer")
}

// Recruiting follows the capability lifecycle the P0 fix introduced: only
// 'active' qualifies.
func TestWorkspaceRecruiterEligibilityFollowsCapabilityLifecycle(t *testing.T) {
	pool := connectDB(t)

	for _, status := range []string{"pending", "suspended"} {
		t.Run(status, func(t *testing.T) {
			user := seedUser(t, pool, "user", "active")
			seedRecruiterCapability(t, pool, user, status)
			assertResolved(t, resolveKeys(t, pool, user), "professional")
		})
	}

	t.Run("active", func(t *testing.T) {
		user := seedUser(t, pool, "user", "active")
		seedRecruiterCapability(t, pool, user, "active")
		assertResolved(t, resolveKeys(t, pool, user), "professional", "recruiting")
	})
}

// The recruiter P0, restated as a workspace question: a legacy role_id must not
// conjure the Recruiting workspace any more than it conjures the capability.
func TestWorkspaceLegacyRecruiterRoleGrantsNoRecruiting(t *testing.T) {
	pool := connectDB(t)
	user := seedUser(t, pool, "recruiter", "active")
	assertResolved(t, resolveKeys(t, pool, user), "professional")
}

// Approved membership at a managing role yields the company; the same
// membership revoked yields nothing.
func TestWorkspaceCompanyMembershipStatusIsHonoured(t *testing.T) {
	pool := connectDB(t)
	companyID, handle := seedWorkspaceCompany(t, pool, "CI Workspace Approved Co")

	approved := seedUser(t, pool, "user", "active")
	addCompanyMember(t, pool, companyID, approved, "org_admin", "approved")
	assertResolved(t, resolveKeys(t, pool, approved), "professional", "company:"+companyID.String())

	revoked := seedUser(t, pool, "user", "active")
	addCompanyMember(t, pool, companyID, revoked, "org_admin", "removed")
	assertResolved(t, resolveKeys(t, pool, revoked), "professional")

	// And the route carries the served handle rather than the id.
	got, err := newResolver(t, pool).ResolveForUser(t.Context(), approved)
	if err != nil {
		t.Fatal(err)
	}
	if want := "/companies/" + handle + "/admin"; got[1].Route != want {
		t.Errorf("company route = %q, want %q", got[1].Route, want)
	}
}

// Owning a company is authority in its own right, with or without a membership
// row. Company creators are the common case, and LoadGrant treats ownership the
// same way, so the bulk lister must too.
func TestWorkspaceCompanyOwnershipAloneYieldsTheWorkspace(t *testing.T) {
	pool := connectDB(t)
	owner := seedUser(t, pool, "user", "active")

	companyID := uuid.New()
	handle := "ci-ws-own-" + strings.Split(companyID.String(), "-")[0]
	if _, err := pool.Exec(t.Context(), `
		INSERT INTO companies (id, name, handle, status, owner_id, created_by, created_at, updated_at)
		VALUES ($1, 'CI Workspace Owned Co', $2, 'active', $3, $3, NOW(), NOW())`,
		companyID, handle, owner); err != nil {
		t.Fatalf("seeding owned company: %v", err)
	}
	if _, err := pool.Exec(t.Context(),
		`INSERT INTO company_profiles (company_id) VALUES ($1) ON CONFLICT DO NOTHING`, companyID); err != nil {
		t.Fatalf("seeding company profile: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM companies WHERE id = $1`, companyID)
	})

	assertResolved(t, resolveKeys(t, pool, owner), "professional", "company:"+companyID.String())
}

// Employees and viewers are members without management authority, and get no
// company workspace. This is the threshold decision, proved end to end.
func TestWorkspaceCompanyMembershipWithoutAuthority(t *testing.T) {
	pool := connectDB(t)
	companyID, _ := seedWorkspaceCompany(t, pool, "CI Workspace Threshold Co")

	for _, role := range []string{"employee", "viewer"} {
		t.Run(role, func(t *testing.T) {
			user := seedUser(t, pool, "user", "active")
			addCompanyMember(t, pool, companyID, user, role, "approved")
			assertResolved(t, resolveKeys(t, pool, user), "professional")
		})
	}
}

// Active management membership yields the community; anything else does not.
func TestWorkspaceCommunityMembershipStatusAndRole(t *testing.T) {
	pool := connectDB(t)
	communityID := seedCommunity(t, pool, "CI Workspace Community")

	for _, role := range []string{"owner", "admin", "moderator"} {
		t.Run("active_"+role, func(t *testing.T) {
			user := seedUser(t, pool, "user", "active")
			addCommunityMember(t, pool, communityID, user, role, "active")
			assertResolved(t, resolveKeys(t, pool, user),
				"professional", "community_admin:"+communityID.String())
		})
	}

	t.Run("active_member", func(t *testing.T) {
		user := seedUser(t, pool, "user", "active")
		addCommunityMember(t, pool, communityID, user, "member", "active")
		assertResolved(t, resolveKeys(t, pool, user), "professional")
	})

	t.Run("banned_owner", func(t *testing.T) {
		user := seedUser(t, pool, "user", "active")
		addCommunityMember(t, pool, communityID, user, "owner", "banned")
		assertResolved(t, resolveKeys(t, pool, user), "professional")
	})
}

// Platform admin mirrors AdminRoles() exactly - all three, and nothing else.
func TestWorkspacePlatformAdminMirrorsAdminRoles(t *testing.T) {
	pool := connectDB(t)

	for _, role := range []string{"admin", "super_admin", "platform_admin"} {
		t.Run(role, func(t *testing.T) {
			user := seedUser(t, pool, role, "active")
			assertResolved(t, resolveKeys(t, pool, user), "professional", "platform_admin")
		})
	}

	for _, role := range []string{"user", "moderator", "hiring_manager"} {
		t.Run("not_"+role, func(t *testing.T) {
			user := seedUser(t, pool, role, "active")
			assertResolved(t, resolveKeys(t, pool, user), "professional")
		})
	}
}

// A non-active account gets nothing, whatever it would otherwise be entitled to.
func TestWorkspaceInactiveAccountResolvesToNothing(t *testing.T) {
	pool := connectDB(t)
	user := seedUser(t, pool, "platform_admin", "deleted")
	seedFreelancerProfile(t, pool, user)
	seedRecruiterCapability(t, pool, user, "active")

	if _, err := newResolver(t, pool).ResolveForUser(t.Context(), user); !errors.Is(err, workspaceService.ErrAccountNotEligible) {
		t.Fatalf("error = %v, want ErrAccountNotEligible", err)
	}
}

// A user who is not in the database at all is a not-found, not an empty list.
func TestWorkspaceUnknownUserIsNotFound(t *testing.T) {
	pool := connectDB(t)
	if _, err := newResolver(t, pool).ResolveForUser(t.Context(), uuid.New()); err == nil {
		t.Fatal("resolving an account that does not exist returned no error")
	}
}

// Everything at once, in the documented order, against real rows.
func TestWorkspaceMultiCapabilityUserAgainstPostgres(t *testing.T) {
	pool := connectDB(t)
	user := seedUser(t, pool, "platform_admin", "active")
	seedFreelancerProfile(t, pool, user)
	seedRecruiterCapability(t, pool, user, "active")

	acme, _ := seedWorkspaceCompany(t, pool, "AAA CI Workspace Acme")
	zebra, _ := seedWorkspaceCompany(t, pool, "ZZZ CI Workspace Zebra")
	addCompanyMember(t, pool, acme, user, "recruiter_admin", "approved")
	addCompanyMember(t, pool, zebra, user, "hiring_manager", "approved")

	first := seedCommunity(t, pool, "AAA CI Workspace Community")
	second := seedCommunity(t, pool, "ZZZ CI Workspace Community")
	addCommunityMember(t, pool, first, user, "owner", "active")
	addCommunityMember(t, pool, second, user, "moderator", "active")

	assertResolved(t, resolveKeys(t, pool, user),
		"professional",
		"freelancer",
		"recruiting",
		"company:"+acme.String(),
		"company:"+zebra.String(),
		"community_admin:"+first.String(),
		"community_admin:"+second.String(),
		"platform_admin",
	)
}

// Cross-tenant: authority on one entity leaks nothing about another.
func TestWorkspaceResolutionIsCrossTenantSafe(t *testing.T) {
	pool := connectDB(t)

	companyA, _ := seedWorkspaceCompany(t, pool, "CI Workspace Tenant A")
	companyB, _ := seedWorkspaceCompany(t, pool, "CI Workspace Tenant B")
	communityX := seedCommunity(t, pool, "CI Workspace Community X")
	communityY := seedCommunity(t, pool, "CI Workspace Community Y")

	user := seedUser(t, pool, "user", "active")
	addCompanyMember(t, pool, companyA, user, "org_admin", "approved")
	addCommunityMember(t, pool, communityX, user, "admin", "active")

	// Another account manages the entities this user must not see, so those
	// rows exist and are reachable - the test would pass vacuously otherwise.
	stranger := seedUser(t, pool, "user", "active")
	addCompanyMember(t, pool, companyB, stranger, "org_admin", "approved")
	addCommunityMember(t, pool, communityY, stranger, "admin", "active")

	got := resolveKeys(t, pool, user)
	assertResolved(t, got,
		"professional",
		"company:"+companyA.String(),
		"community_admin:"+communityX.String(),
	)
	for _, key := range got {
		if strings.Contains(key, companyB.String()) || strings.Contains(key, communityY.String()) {
			t.Errorf("resolution leaked an unrelated entity: %s", key)
		}
	}
}

// Resolution writes nothing.
//
// The recruiter P0 was a read path that provisioned; this resolver touches six
// domains, so the same mistake would be six times the surface. Counting rows
// across every table the resolver reads, before and after repeated resolution,
// is the assertion that would have caught it.
func TestWorkspaceResolutionCreatesNoRecords(t *testing.T) {
	pool := connectDB(t)
	tables := []string{
		"users", "organizations", "recruiter_profiles", "recruiter_organization_profiles",
		"freelancer_profiles", "companies", "company_members", "company_member_roles",
		"communities", "community_members",
	}

	count := func() map[string]int {
		counts := map[string]int{}
		for _, table := range tables {
			var n int
			if err := pool.QueryRow(t.Context(), `SELECT count(*) FROM `+table).Scan(&n); err != nil {
				t.Fatalf("counting %s: %v", table, err)
			}
			counts[table] = n
		}
		return counts
	}

	// An account with nothing: the shape most likely to tempt a provisioning
	// fallback into existence.
	user := seedUser(t, pool, "user", "active")
	resolver := newResolver(t, pool)

	before := count()
	for i := 0; i < 5; i++ {
		if _, err := resolver.ResolveForUser(t.Context(), user); err != nil {
			t.Fatalf("ResolveForUser: %v", err)
		}
	}
	after := count()

	for table, beforeCount := range before {
		if after[table] != beforeCount {
			t.Errorf("%s grew from %d to %d: resolving workspaces created records",
				table, beforeCount, after[table])
		}
	}
}

// No fixture produces a page-admin workspace, and every returned entity-scoped
// workspace carries the entity id it names.
func TestWorkspaceInvariantsHoldAgainstPostgres(t *testing.T) {
	pool := connectDB(t)
	user := seedUser(t, pool, "platform_admin", "active")
	companyID, _ := seedWorkspaceCompany(t, pool, "CI Workspace Invariants Co")
	addCompanyMember(t, pool, companyID, user, "org_admin", "approved")
	communityID := seedCommunity(t, pool, "CI Workspace Invariants Community")
	addCommunityMember(t, pool, communityID, user, "owner", "active")

	got, err := newResolver(t, pool).ResolveForUser(t.Context(), user)
	if err != nil {
		t.Fatal(err)
	}

	defaults := 0
	seen := map[string]bool{}
	for _, workspace := range got {
		if strings.Contains(string(workspace.Type), "page") {
			t.Errorf("returned a page workspace %q", workspace.Type)
		}
		if workspace.IsDefault {
			defaults++
			if workspace.Type != workspaceDomain.TypeProfessional {
				t.Errorf("default workspace is %q, want professional", workspace.Type)
			}
		}
		if workspace.Type.IsEntityScoped() && (workspace.EntityID == nil || *workspace.EntityID == "") {
			t.Errorf("%s is entity-scoped but names no entity", workspace.Key)
		}
		if seen[workspace.Key] {
			t.Errorf("duplicate workspace key %q", workspace.Key)
		}
		seen[workspace.Key] = true
		if strings.TrimSpace(workspace.Label) == "" {
			t.Errorf("%s has a blank label", workspace.Key)
		}
		if strings.TrimSpace(workspace.Route) == "" || strings.Contains(workspace.Route, "//") {
			t.Errorf("%s has a malformed route %q", workspace.Key, workspace.Route)
		}
	}
	if defaults != 1 {
		t.Errorf("%d default workspaces, want exactly 1", defaults)
	}
}

// queryCounter counts the statements one pool actually issues.
//
// It exists because "no N+1" is a claim about query shape, and the only honest
// way to keep that claim true is to measure it. A loop that calls LoadGrant per
// membership reads identically to a bulk lister at the call site; the two differ
// only in how many round trips they make, which is exactly what this counts.
type queryCounter struct{ n int }

func (c *queryCounter) TraceQueryStart(ctx context.Context, _ *pgx.Conn, _ pgx.TraceQueryStartData) context.Context {
	c.n++
	return ctx
}

func (c *queryCounter) TraceQueryEnd(_ context.Context, _ *pgx.Conn, _ pgx.TraceQueryEndData) {}

// TestWorkspaceResolutionQueryCountIsConstant proves the resolver costs the same
// whether the account manages one company or many.
//
// This matters because the resolver is destined for /auth/me, which runs on
// every page load and after every token refresh. A per-membership query would
// be invisible in testing - most accounts manage nothing - and would degrade
// exactly for the accounts that use the product most.
func TestWorkspaceResolutionQueryCountIsConstant(t *testing.T) {
	pool := connectDB(t)

	measure := func(companies, communities int) int {
		user := seedUser(t, pool, "platform_admin", "active")
		seedFreelancerProfile(t, pool, user)
		seedRecruiterCapability(t, pool, user, "active")
		for i := 0; i < companies; i++ {
			companyID, _ := seedWorkspaceCompany(t, pool, fmt.Sprintf("CI Workspace Budget %d %s", i, uuid.NewString()))
			addCompanyMember(t, pool, companyID, user, "org_admin", "approved")
		}
		for i := 0; i < communities; i++ {
			communityID := seedCommunity(t, pool, fmt.Sprintf("CI Workspace Budget Community %d %s", i, uuid.NewString()))
			addCommunityMember(t, pool, communityID, user, "owner", "active")
		}

		counter := &queryCounter{}
		config, err := pgxpool.ParseConfig(required(t, "DATABASE_URL"))
		if err != nil {
			t.Fatal(err)
		}
		config.ConnConfig.Tracer = counter
		counted, err := pgxpool.NewWithConfig(t.Context(), config)
		if err != nil {
			t.Fatal(err)
		}
		defer counted.Close()

		// Warm a connection so the pool's own setup is not counted as resolver work.
		if _, err := counted.Exec(t.Context(), `SELECT 1`); err != nil {
			t.Fatal(err)
		}
		counter.n = 0

		if _, err := newResolver(t, counted).ResolveForUser(t.Context(), user); err != nil {
			t.Fatalf("ResolveForUser: %v", err)
		}
		return counter.n
	}

	small := measure(1, 1)
	large := measure(8, 8)

	if small != large {
		t.Errorf("resolution issued %d queries for 1 company + 1 community and %d for 8 + 8: "+
			"the cost grows with membership count, which is the N+1 shape this must not have",
			small, large)
	}
	// One query per domain: account, freelancer, recruiter, companies, communities.
	if small != 5 {
		t.Errorf("resolution issued %d queries, want 5 - one per domain", small)
	}
	t.Logf("workspace resolution: %d queries, constant across membership counts", small)
}

/*
The resolver as served by GET /api/v1/auth/me.

The tests above drive the resolver in-process; these go through the real HTTP
endpoint, because that is where the integration can actually break: a field
that never leaves the service, a payload shape the client cannot read, or a
resolver that was built but never attached to the auth service. Wiring is not
provable by a unit test - main.go is the thing under test here.
*/

// meWorkspaces is the workspace half of the /auth/me payload.
type meWorkspaces struct {
	Workspaces []struct {
		Key       string  `json:"key"`
		Type      string  `json:"type"`
		EntityID  *string `json:"entityId"`
		Label     string  `json:"label"`
		Slug      string  `json:"slug"`
		Route     string  `json:"route"`
		IsDefault bool    `json:"isDefault"`
	} `json:"workspaces"`
	WorkspacesComplete bool `json:"workspacesComplete"`
	// Read back so the additive change can be shown not to have displaced the
	// fields the web client already depends on.
	Permissions []string `json:"permissions"`
	User        struct {
		Email string `json:"email"`
	} `json:"user"`
}

func getMe(t *testing.T, base, token string) meWorkspaces {
	t.Helper()
	resp := do(t, http.MethodGet, base+"/api/v1/auth/me", token, nil)
	body, err := readBody(resp)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /auth/me: got %d want 200: %s", resp.StatusCode, body)
	}
	var payload meWorkspaces
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		t.Fatalf("decoding /auth/me: %v (body %s)", err, body)
	}
	return payload
}

func meKeys(payload meWorkspaces) []string {
	keys := make([]string, 0, len(payload.Workspaces))
	for _, workspace := range payload.Workspaces {
		keys = append(keys, workspace.Key)
	}
	return keys
}

// A newly registered account bootstraps with exactly the professional
// workspace, marked default, and the list is complete.
func TestAuthMeServesWorkspacesForAFreshAccount(t *testing.T) {
	base := required(t, "TEST_API_URL")
	user := registerAndLogin(t, base)

	payload := getMe(t, base, user.token)

	if !payload.WorkspacesComplete {
		t.Error("workspacesComplete is false: the resolver is not wired into /auth/me, or resolution failed")
	}
	assertResolved(t, meKeys(payload), "professional")
	if !payload.Workspaces[0].IsDefault {
		t.Error("the professional workspace is not marked default")
	}
	if payload.Workspaces[0].Route != "/feed" {
		t.Errorf("professional route = %q, want /feed", payload.Workspaces[0].Route)
	}
	if payload.Workspaces[0].EntityID != nil {
		t.Error("the professional workspace carries an entity id")
	}

	// The change is additive or it is a breaking change.
	if payload.User.Email != user.email {
		t.Errorf("user.email = %q, want %q", payload.User.Email, user.email)
	}
	if len(payload.Permissions) == 0 {
		t.Error("permissions disappeared from the /auth/me payload")
	}
}

// Completing recruiter onboarding adds the recruiting workspace to the next
// bootstrap, without a new token and without signing in again. That is the
// whole promise of one identity with several workspaces.
func TestAuthMeReflectsCapabilityGainedWithoutReAuthenticating(t *testing.T) {
	base := required(t, "TEST_API_URL")
	user := registerAndLogin(t, base)

	before := getMe(t, base, user.token)
	assertResolved(t, meKeys(before), "professional")

	becomeRecruiter(t, base, user)

	// Same token, deliberately: scoped authority is resolved per request, not
	// carried in the JWT, so it must appear without a refresh.
	after := getMe(t, base, user.token)
	assertResolved(t, meKeys(after), "professional", "recruiting")
	if !after.WorkspacesComplete {
		t.Error("workspacesComplete is false after a successful resolution")
	}
	for _, workspace := range after.Workspaces {
		if workspace.Type == "recruiting" && workspace.Route != "/recruiter" {
			t.Errorf("recruiting route = %q, want /recruiter", workspace.Route)
		}
	}
}

// A multi-capability account bootstraps with every workspace it holds, in the
// documented order, through the real endpoint.
func TestAuthMeServesEveryWorkspaceForAMultiCapabilityAccount(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)

	userID, err := uuid.Parse(user.id)
	if err != nil {
		t.Fatalf("parsing the registered account id %q: %v", user.id, err)
	}

	seedFreelancerProfile(t, pool, userID)
	becomeRecruiter(t, base, user)

	companyID, handle := seedWorkspaceCompany(t, pool, "AAA CI Auth Me Company")
	addCompanyMember(t, pool, companyID, userID, "org_admin", "approved")
	communityID := seedCommunity(t, pool, "AAA CI Auth Me Community")
	addCommunityMember(t, pool, communityID, userID, "owner", "active")

	// Platform administration is read from users.role_id, the same value
	// RequireAdmin() enforces.
	if _, err := pool.Exec(t.Context(),
		`UPDATE users SET role_id = 'platform_admin' WHERE id = $1`, userID); err != nil {
		t.Fatal(err)
	}

	payload := getMe(t, base, user.token)
	if !payload.WorkspacesComplete {
		t.Error("workspacesComplete is false for a successful resolution")
	}
	assertResolved(t, meKeys(payload),
		"professional",
		"freelancer",
		"recruiting",
		"company:"+companyID.String(),
		"community_admin:"+communityID.String(),
		"platform_admin",
	)

	byKey := map[string]string{}
	defaults := 0
	for _, workspace := range payload.Workspaces {
		byKey[workspace.Key] = workspace.Route
		if workspace.IsDefault {
			defaults++
		}
	}
	if defaults != 1 {
		t.Errorf("%d default workspaces, want exactly 1", defaults)
	}
	if got, want := byKey["company:"+companyID.String()], "/companies/"+handle+"/admin"; got != want {
		t.Errorf("company route = %q, want %q", got, want)
	}
	if got, want := byKey["community_admin:"+communityID.String()], "/communities/"+communityID.String()+"/admin"; got != want {
		t.Errorf("community route = %q, want %q", got, want)
	}
}

// The workspace list is navigation, never authorization.
//
// This is the invariant that makes serving the list safe at all: a client that
// forges an entry, or a server that served one by mistake, gains nothing. The
// account here holds no recruiting capability, so /recruiter/* must refuse it
// regardless of what any list says.
func TestAuthMeWorkspaceListIsNotAnAuthorizationInput(t *testing.T) {
	base := required(t, "TEST_API_URL")
	user := registerAndLogin(t, base)

	payload := getMe(t, base, user.token)
	for _, workspace := range payload.Workspaces {
		if workspace.Type == "recruiting" || workspace.Type == "platform_admin" {
			t.Fatalf("an ordinary account was served the %q workspace", workspace.Type)
		}
	}

	// And the routes behind the workspaces it was not given still refuse it.
	for _, path := range []string{
		"/api/v1/recruiter/dashboard",
		"/api/v1/search/candidates",
	} {
		resp := do(t, http.MethodPost, base+path, user.token, map[string]any{})
		body, _ := readBody(resp)
		if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
			t.Errorf("%s served an account with no such workspace: %d %s", path, resp.StatusCode, body)
		}
	}
}

// Bootstrapping writes nothing.
//
// /auth/me now resolves six domains on every page load and every token
// refresh, which is the highest-traffic read in the product. If any of it
// provisioned, it would provision constantly.
func TestAuthMeBootstrapCreatesNoRecords(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)

	tables := []string{
		"organizations", "recruiter_profiles", "recruiter_organization_profiles",
		"freelancer_profiles", "companies", "company_members", "company_member_roles",
		"communities", "community_members",
	}
	count := func() map[string]int {
		counts := map[string]int{}
		for _, table := range tables {
			var n int
			if err := pool.QueryRow(t.Context(), `SELECT count(*) FROM `+table).Scan(&n); err != nil {
				t.Fatalf("counting %s: %v", table, err)
			}
			counts[table] = n
		}
		return counts
	}

	before := count()
	for i := 0; i < 5; i++ {
		getMe(t, base, user.token)
	}
	after := count()

	for table, beforeCount := range before {
		if after[table] != beforeCount {
			t.Errorf("%s grew from %d to %d: bootstrapping created records",
				table, beforeCount, after[table])
		}
	}
}
