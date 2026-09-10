//go:build ciintegration

package ci

import (
	"bytes"
	"encoding/json"
	"net/http"
	"sort"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	adminDomain "kirmya/internal/admin/domain"
)

/*
The two admin systems, reconciled.

RequireAdmin() reads users.role_id and decides who is an administrator.
admin_user_roles decides what a given administrator may do. The join between
them is one rule - no assignment means every permission - and these tests exist
to hold the two halves of it:

  nobody is locked out    every administrator today has no assignment, and must
                          keep working exactly as before
  nothing is widened      no assignment, and no role, admits anyone the outer
                          gate refuses

The first is why this was safe to deploy. The second is why it is safe at all.
*/

// The seeded vocabulary and the Go definition must be the same thing. They are
// written in two languages in two files, and only this test keeps them equal.
func TestAdminRBACSeedMatchesTheCode(t *testing.T) {
	pool := connectDB(t)

	// Permissions.
	rows, err := pool.Query(t.Context(), `SELECT code FROM admin_permissions`)
	if err != nil {
		t.Fatalf("reading admin_permissions: %v", err)
	}
	var seededPerms []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			t.Fatal(err)
		}
		seededPerms = append(seededPerms, code)
	}
	rows.Close()

	wantPerms := adminDomain.AllPermissions()
	sort.Strings(seededPerms)
	sort.Strings(wantPerms)
	if len(seededPerms) == 0 {
		t.Fatal("admin_permissions is empty: migration 0099 did not run")
	}
	if !equalStrings(seededPerms, wantPerms) {
		t.Errorf("seeded permissions differ from the code's\n seeded: %v\n   code: %v", seededPerms, wantPerms)
	}

	// Roles, and what each carries.
	for _, role := range adminDomain.RoleCodes() {
		rows, err := pool.Query(t.Context(), `
			SELECT p.code
			FROM admin_permissions p
			JOIN admin_role_permissions rp ON rp.permission_id = p.id
			JOIN admin_roles r ON r.id = rp.role_id
			WHERE r.code = $1`, role)
		if err != nil {
			t.Fatalf("reading permissions for %s: %v", role, err)
		}
		var seeded []string
		for rows.Next() {
			var code string
			if err := rows.Scan(&code); err != nil {
				t.Fatal(err)
			}
			seeded = append(seeded, code)
		}
		rows.Close()

		want, ok := adminDomain.PermissionsForRole(role)
		if !ok {
			t.Fatalf("RoleCodes() named %s and PermissionsForRole does not know it", role)
		}
		sort.Strings(seeded)
		sort.Strings(want)
		if !equalStrings(seeded, want) {
			t.Errorf("%s: seeded permissions differ from the code's\n seeded: %v\n   code: %v",
				role, seeded, want)
		}
	}
}

func equalStrings(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// The property that made this safe to ship: an administrator with no assignment
// reaches everything, exactly as before any of this existed.
func TestAdminWithNoAssignmentReachesEverything(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	admin := registerAndLogin(t, base)
	admin = makePlatformAdmin(t, pool, admin)

	var assignments int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM admin_user_roles WHERE user_id = $1`, admin.id).Scan(&assignments); err != nil {
		t.Fatalf("counting assignments: %v", err)
	}
	if assignments != 0 {
		t.Fatalf("precondition: this account has %d assignments, want none", assignments)
	}

	// A route from each corner of the admin surface, each gated on a different
	// permission. All must answer, none may refuse.
	for _, path := range []string{
		"/api/v1/admin/dashboard",
		"/api/v1/admin/users",
		"/api/v1/admin/feature-flags",
		"/api/v1/admin/audit-logs",
		"/api/v1/admin/maintenance",
		"/api/v1/admin/observability",
		"/api/v1/admin/roles",
	} {
		resp := do(t, http.MethodGet, base+path, admin.token, nil)
		if resp.StatusCode == http.StatusForbidden {
			body, _ := readBody(resp)
			t.Errorf("GET %s refused an administrator with no assignment: %s", path, body)
		}
	}
}

// And the narrowing works: the same account, assigned a role that omits a
// permission, is refused the route that needs it while keeping the rest.
func TestAssignedRoleNarrowsAnAdministrator(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)

	assigner := registerAndLogin(t, base)
	assigner = makePlatformAdmin(t, pool, assigner)
	narrowed := registerAndLogin(t, base)
	narrowed = makePlatformAdmin(t, pool, narrowed)

	// Before: reaches feature flags.
	if resp := do(t, http.MethodGet, base+"/api/v1/admin/feature-flags", narrowed.token, nil); resp.StatusCode == http.StatusForbidden {
		t.Fatal("precondition: the account is refused before being narrowed")
	}

	assign := do(t, http.MethodPost, base+"/api/v1/admin/roles/assign", assigner.token, map[string]any{
		"userId":   narrowed.id,
		"roleCode": adminDomain.RoleAnalyticsAdmin,
		"reason":   "CI narrowing test",
	})
	if assign.StatusCode != http.StatusOK {
		body, _ := readBody(assign)
		t.Fatalf("assigning analytics_admin: got %d want 200: %s", assign.StatusCode, body)
	}

	// After: analytics_admin carries analytics.read and audit_logs.read, and
	// not feature_flags.manage.
	if resp := do(t, http.MethodGet, base+"/api/v1/admin/audit-logs", narrowed.token, nil); resp.StatusCode == http.StatusForbidden {
		t.Error("a narrowed analytics_admin was refused audit logs, which the role carries")
	}
	resp := do(t, http.MethodGet, base+"/api/v1/admin/feature-flags", narrowed.token, nil)
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("GET /admin/feature-flags: got %d, want 403 for a narrowed analytics_admin", resp.StatusCode)
	}

	// Revoking returns them to everything.
	revoke := do(t, http.MethodPost, base+"/api/v1/admin/roles/revoke", assigner.token, map[string]any{
		"userId":   narrowed.id,
		"roleCode": adminDomain.RoleAnalyticsAdmin,
		"reason":   "CI narrowing test, undo",
	})
	if revoke.StatusCode != http.StatusOK {
		body, _ := readBody(revoke)
		t.Fatalf("revoking: got %d want 200: %s", revoke.StatusCode, body)
	}
	if resp := do(t, http.MethodGet, base+"/api/v1/admin/feature-flags", narrowed.token, nil); resp.StatusCode == http.StatusForbidden {
		t.Error("still refused after the assignment was revoked")
	}
}

// The outer gate is untouched. No assignment, and no role, admits a
// non-administrator - the permission tier can only ever refuse.
func TestPermissionsNeverAdmitANonAdministrator(t *testing.T) {
	base := required(t, "TEST_API_URL")
	ordinary := registerAndLogin(t, base)

	// An ordinary account has no assignment, which is the "every permission"
	// case - and it still reaches nothing, because RequireAdmin() runs first.
	//
	// The assertion is exactly 403, deliberately, and not "403 or 401". This
	// account holds a valid token, so 401 would mean the request was refused
	// for want of authentication rather than by the role check - which is what
	// happens if the outer gate is removed, since nothing else on the group
	// authenticates. Accepting either status let the test pass with
	// RequireAdmin() deleted, proving nothing at all; it was written that way
	// first and a negative control caught it.
	for _, path := range []string{
		"/api/v1/admin/dashboard",
		"/api/v1/admin/users",
		"/api/v1/admin/roles",
		"/api/v1/admin/feature-flags",
	} {
		resp := do(t, http.MethodGet, base+path, ordinary.token, nil)
		if resp.StatusCode != http.StatusForbidden {
			body, _ := readBody(resp)
			t.Errorf("GET %s answered %d for an authenticated non-administrator, want 403 from the role check: %s",
				path, resp.StatusCode, body)
		}
	}
}

// An unknown role code is refused rather than silently stored. The INSERT that
// backs this matched no row and reported success, so the console could report a
// role assigned that was not.
func TestAssigningAnUnknownRoleIsRefused(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	assigner := registerAndLogin(t, base)
	assigner = makePlatformAdmin(t, pool, assigner)
	target := registerAndLogin(t, base)

	resp := do(t, http.MethodPost, base+"/api/v1/admin/roles/assign", assigner.token, map[string]any{
		"userId":   target.id,
		"roleCode": "wizard_admin",
		"reason":   "CI unknown role test",
	})
	if resp.StatusCode != http.StatusBadRequest {
		body, _ := readBody(resp)
		t.Errorf("assigning an unknown role: got %d want 400: %s", resp.StatusCode, body)
	}

	var rows int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM admin_user_roles WHERE user_id = $1`, target.id).Scan(&rows); err != nil {
		t.Fatalf("counting assignments: %v", err)
	}
	if rows != 0 {
		t.Errorf("a refused assignment wrote %d rows", rows)
	}
}

// An administrator cannot narrow themselves, because a narrowing that removes
// roles.manage cannot be undone by the person who applied it.
func TestAnAdministratorCannotNarrowThemselves(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	admin := registerAndLogin(t, base)
	admin = makePlatformAdmin(t, pool, admin)

	resp := do(t, http.MethodPost, base+"/api/v1/admin/roles/assign", admin.token, map[string]any{
		"userId":   admin.id,
		"roleCode": adminDomain.RoleReadOnlyAdmin,
		"reason":   "CI self-narrowing test",
	})
	if resp.StatusCode != http.StatusForbidden {
		body, _ := readBody(resp)
		t.Errorf("self-assignment: got %d want 403: %s", resp.StatusCode, body)
	}

	var rows int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM admin_user_roles WHERE user_id = $1`, admin.id).Scan(&rows); err != nil {
		t.Fatalf("counting assignments: %v", err)
	}
	if rows != 0 {
		t.Errorf("a refused self-assignment wrote %d rows", rows)
	}
}

// makePlatformAdmin promotes an account and returns it holding a token that
// says so.
//
// Two steps, and the second is the one that catches people out: nothing in the
// API grants a platform role, so the promotion is a direct UPDATE - and the
// role travels in the access token, so a token issued before the UPDATE still
// says "user". Signing in again is what makes the promotion visible to
// RequireAdmin().
func makePlatformAdmin(t *testing.T, pool *pgxpool.Pool, user ciUser) ciUser {
	t.Helper()

	if _, err := pool.Exec(t.Context(),
		`UPDATE users SET role_id = 'platform_admin' WHERE id = $1`, user.id); err != nil {
		t.Fatalf("promoting %s: %v", user.email, err)
	}

	loginBody, err := json.Marshal(map[string]any{"email": user.email, "password": ciPassword})
	if err != nil {
		t.Fatal(err)
	}
	resp, err := httpClient().Post(required(t, "TEST_API_URL")+"/api/v1/auth/login",
		"application/json", bytes.NewReader(loginBody))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("re-login after promotion: got %d want 200", resp.StatusCode)
	}
	var login struct {
		AccessToken string `json:"accessToken"`
		Token       string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&login); err != nil {
		t.Fatal(err)
	}
	token := login.AccessToken
	if token == "" {
		token = login.Token
	}
	if token == "" {
		t.Fatal("re-login returned no access token")
	}

	user.token = token
	return user
}

/*
Enforcement across modules.

The tests above cover /api/v1/admin/*, which is one module. The administrative
surface is twenty-one: notifications, support, compliance, legal, billing,
backups, data operations, security, trust & safety, analytics and the rest each
mount an /admin group of their own, and until this slice each of those groups
carried RequireAdmin() and nothing else.

That made the narrowing a half-truth. read_only_admin - an account whose whole
definition is "sees the administrative surface, changes nothing" - was refused
PUT /admin/users/:id/status and allowed POST /admin/backups/restore-confirm.
The tests below are against a real database and a running API, because that gap
was invisible to every unit test in the repository: each module's routes were
correct in isolation, and the promise they broke was made somewhere else.
*/

// crossModuleWrites are state-changing routes, one per module, each gated on a
// permission read_only_admin does not carry.
//
// The bodies are deliberately empty. A permission gate runs before a handler
// parses anything, so what matters is only that the request is refused before
// it gets there - and an empty body means a route that is *not* gated fails
// this test loudly on a 400 rather than quietly succeeding on a valid payload.
var crossModuleWrites = []struct {
	method, path, permission string
}{
	{http.MethodPost, "/api/v1/admin/backups/restore-confirm", "backups.manage"},
	{http.MethodPut, "/api/v1/admin/security/settings", "security.manage"},
	{http.MethodPost, "/api/v1/admin/data-operations/bulk-operations", "data_operations.manage"},
	{http.MethodPatch, "/api/v1/admin/compliance/legal-holds/00000000-0000-0000-0000-000000000001/release", "compliance.manage"},
	{http.MethodPost, "/api/v1/admin/support/tickets/00000000-0000-0000-0000-000000000001/resolve", "support.manage"},
	{http.MethodPost, "/api/v1/admin/notifications/templates", "notifications.manage"},
	{http.MethodPost, "/api/v1/admin/analytics/export", "analytics.manage"},
	{http.MethodPut, "/api/v1/admin/privacy/requests/00000000-0000-0000-0000-000000000001", "compliance.manage"},
	{http.MethodPost, "/api/v1/admin/trust-safety/reinstatements", "users.suspend"},
	{http.MethodPost, "/api/v1/admin/system/health/maintenance", "maintenance.manage"},
}

// crossModuleReads are the counterpart: routes read_only_admin must keep.
var crossModuleReads = []struct{ path, permission string }{
	{"/api/v1/admin/backups", "backups.read"},
	{"/api/v1/admin/support/tickets", "support.read"},
	{"/api/v1/admin/compliance/dsr", "compliance.read"},
	{"/api/v1/admin/notifications/queue", "notifications.read"},
	{"/api/v1/admin/billing/status", "billing.read"},
	{"/api/v1/admin/data-operations/imports", "data_operations.read"},
	{"/api/v1/admin/security/events", "security_events.read"},
}

func assignRole(t *testing.T, base string, assigner, target ciUser, roleCode, reason string) {
	t.Helper()
	resp := do(t, http.MethodPost, base+"/api/v1/admin/roles/assign", assigner.token, map[string]any{
		"userId":   target.id,
		"roleCode": roleCode,
		"reason":   reason,
	})
	if resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Fatalf("assigning %s: got %d want 200: %s", roleCode, resp.StatusCode, body)
	}
}

// An administrator with no assignment reaches every module's writes. This is
// the precondition the narrowing test below is measured against, and on its own
// it is the no-lockout guarantee for the nineteen modules that had no granular
// gate until now: adding one must not have refused anybody anything.
func TestUnassignedAdministratorReachesEveryModule(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	admin := makePlatformAdmin(t, pool, registerAndLogin(t, base))

	for _, rt := range crossModuleWrites {
		resp := do(t, rt.method, base+rt.path, admin.token, map[string]any{})
		if resp.StatusCode == http.StatusForbidden {
			body, _ := readBody(resp)
			t.Errorf("%s %s refused an administrator with no assignment: %s", rt.method, rt.path, body)
		}
	}
	for _, rt := range crossModuleReads {
		resp := do(t, http.MethodGet, base+rt.path, admin.token, nil)
		if resp.StatusCode == http.StatusForbidden {
			body, _ := readBody(resp)
			t.Errorf("GET %s refused an administrator with no assignment: %s", rt.path, body)
		}
	}
}

// The promise read_only_admin's name makes, kept in every module rather than in
// one. Each of these routes was reachable by this role before this slice.
func TestReadOnlyAdminChangesNothingInAnyModule(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	assigner := makePlatformAdmin(t, pool, registerAndLogin(t, base))
	narrowed := makePlatformAdmin(t, pool, registerAndLogin(t, base))

	assignRole(t, base, assigner, narrowed, adminDomain.RoleReadOnlyAdmin, "CI cross-module read-only test")

	for _, rt := range crossModuleWrites {
		resp := do(t, rt.method, base+rt.path, narrowed.token, map[string]any{})
		if resp.StatusCode != http.StatusForbidden {
			body, _ := readBody(resp)
			t.Errorf("%s %s answered %d for read_only_admin, want 403 (it needs %s): %s",
				rt.method, rt.path, resp.StatusCode, rt.permission, body)
		}
	}

	// And it keeps what it is for.
	for _, rt := range crossModuleReads {
		resp := do(t, http.MethodGet, base+rt.path, narrowed.token, nil)
		if resp.StatusCode == http.StatusForbidden {
			body, _ := readBody(resp)
			t.Errorf("GET %s refused read_only_admin, which carries %s: %s", rt.path, rt.permission, body)
		}
	}
}

// A role that spans modules narrows in both directions: operations_admin runs
// the machinery and does not touch user accounts.
func TestOperationsAdminIsNarrowedAcrossModules(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	assigner := makePlatformAdmin(t, pool, registerAndLogin(t, base))
	ops := makePlatformAdmin(t, pool, registerAndLogin(t, base))

	assignRole(t, base, assigner, ops, adminDomain.RoleOperationsAdmin, "CI operations narrowing test")

	// Carries backups.manage, in a module that is not internal/admin.
	if resp := do(t, http.MethodPost, base+"/api/v1/admin/backups/restore-confirm", ops.token, map[string]any{}); resp.StatusCode == http.StatusForbidden {
		t.Error("operations_admin was refused a backup restore, which backups.manage permits")
	}
	// Does not carry users.read, in the module that always enforced it.
	if resp := do(t, http.MethodGet, base+"/api/v1/admin/users", ops.token, nil); resp.StatusCode != http.StatusForbidden {
		t.Errorf("GET /admin/users answered %d for operations_admin, want 403", resp.StatusCode)
	}
	// Nor compliance.manage, in a module that had no gate at all before.
	if resp := do(t, http.MethodPost, base+"/api/v1/admin/compliance/legal-holds", ops.token, map[string]any{}); resp.StatusCode != http.StatusForbidden {
		t.Errorf("POST /admin/compliance/legal-holds answered %d for operations_admin, want 403", resp.StatusCode)
	}
}

// A permission refusal in another module answers the same way the admin module
// does. A client that recognises the contract on /admin/users must recognise it
// on /admin/backups, or "403" is the only thing it can act on and it cannot
// tell "you are not an administrator" from "you are, but not that kind".
func TestCrossModuleRefusalCarriesThePermissionContract(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	assigner := makePlatformAdmin(t, pool, registerAndLogin(t, base))
	narrowed := makePlatformAdmin(t, pool, registerAndLogin(t, base))

	assignRole(t, base, assigner, narrowed, adminDomain.RoleReadOnlyAdmin, "CI contract test")

	resp := do(t, http.MethodPost, base+"/api/v1/admin/backups/restore-confirm", narrowed.token, map[string]any{})
	body, err := readBody(resp)
	if err != nil {
		t.Fatalf("reading body: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("got %d want 403: %s", resp.StatusCode, body)
	}

	var payload struct {
		Code  string `json:"code"`
		Error string `json:"error"`
	}
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		t.Fatalf("refusal is not JSON: %v (%s)", err, body)
	}
	if payload.Code != "ADMIN_PERMISSION_REQUIRED" {
		t.Errorf("refusal code %q, want ADMIN_PERMISSION_REQUIRED (body: %s)", payload.Code, body)
	}
	if !bytes.Contains([]byte(payload.Error), []byte(adminDomain.PermBackupsManage)) {
		t.Errorf("refusal does not name the permission needed: %q", payload.Error)
	}
}

// The outer gate still runs first in every module. An ordinary account carries
// no assignment, which is the every-permission case, and must still reach
// nothing - by 403 from the role check, not 401 from a missing token.
func TestOtherModulesRefuseANonAdministrator(t *testing.T) {
	base := required(t, "TEST_API_URL")
	ordinary := registerAndLogin(t, base)

	for _, rt := range crossModuleReads {
		resp := do(t, http.MethodGet, base+rt.path, ordinary.token, nil)
		if resp.StatusCode != http.StatusForbidden {
			body, _ := readBody(resp)
			t.Errorf("GET %s answered %d for an authenticated non-administrator, want 403: %s",
				rt.path, resp.StatusCode, body)
		}
	}
	for _, rt := range crossModuleWrites {
		resp := do(t, rt.method, base+rt.path, ordinary.token, map[string]any{})
		if resp.StatusCode != http.StatusForbidden {
			body, _ := readBody(resp)
			t.Errorf("%s %s answered %d for an authenticated non-administrator, want 403: %s",
				rt.method, rt.path, resp.StatusCode, body)
		}
	}
}
