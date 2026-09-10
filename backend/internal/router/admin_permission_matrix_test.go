package router

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"

	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	"kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// The administrative surface is not only /api/v1/admin/*. Two routes carry an
// administrative capability from under an ordinary prefix, and a sweep that
// matched on the path alone would leave exactly those unverified.
var adminRoutesOutsideAdminPrefix = []string{
	"POST /api/v1/trust/reports/:id/action",
	"POST /api/v1/landing/admin/testimonials",
	"POST /api/v1/landing/admin/featured-jobs",
}

// recordingChecker answers every permission question the same way and remembers
// what it was asked.
//
// Recording is what makes the route -> permission mapping observable from
// outside: the middleware is the only thing that knows which permission a route
// demands, and asking it through a real request is the only way to learn that
// without reading the source and hoping the reader and the router agree.
type recordingChecker struct {
	allow bool
	err   error
	held  map[string]bool // when non-nil, allow is decided by membership
	asked []string
}

func (r *recordingChecker) CheckPermission(_ context.Context, _ uuid.UUID, permission string) (bool, error) {
	r.asked = append(r.asked, permission)
	if r.err != nil {
		return false, r.err
	}
	if r.held != nil {
		return r.held[permission], nil
	}
	return r.allow, nil
}

func (r *recordingChecker) reset() { r.asked = nil }

func checkerHolding(codes []string) *recordingChecker {
	held := make(map[string]bool, len(codes))
	for _, code := range codes {
		held[code] = true
	}
	return &recordingChecker{held: held}
}

// administrativeRoutes is every route behind RequireAdmin(), wherever mounted.
func administrativeRoutes(engine *gin.Engine) []gin.RouteInfo {
	extra := map[string]bool{}
	for _, key := range adminRoutesOutsideAdminPrefix {
		extra[key] = true
	}

	var out []gin.RouteInfo
	for _, rt := range engine.Routes() {
		if strings.HasPrefix(rt.Path, "/api/v1/admin/") || extra[rt.Method+" "+rt.Path] {
			out = append(out, rt)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Path != out[j].Path {
			return out[i].Path < out[j].Path
		}
		return out[i].Method < out[j].Method
	})
	return out
}

func routerWithChecker(checker authz.PermissionChecker) *gin.Engine {
	deps := adminSurfaceHandlers()
	deps.AdminPermissionChecker = checker
	gin.SetMode(gin.TestMode)
	return New(deps, SwaggerConfig{})
}

// TestEveryAdministrativeRouteAsksForAPermission is the ratchet.
//
// It denies every permission and then requires each administrative route to
// answer 403 ADMIN_PERMISSION_REQUIRED to a real administrator. A route that
// never consults the guard cannot produce that answer: it reaches its handler
// instead, and shows up here as an omission.
//
// This is a route-level test rather than a search for "guard.Require" in the
// source. A grep can be satisfied by a line that is present but unreachable, or
// defeated by a group registered somewhere it did not look; a request cannot.
func TestEveryAdministrativeRouteAsksForAPermission(t *testing.T) {
	checker := &recordingChecker{allow: false}
	engine := routerWithChecker(checker)
	routes := administrativeRoutes(engine)
	if len(routes) < 230 {
		t.Fatalf("only %d administrative routes discovered; the router is not fully "+
			"built and this test would pass vacuously", len(routes))
	}

	token := tokenWithRole(t, middleware.RoleAdmin)
	var ungated []string
	for _, rt := range routes {
		checker.reset()
		probe := rt
		probe.Path = resolveParams(rt.Path)
		code := requestAs(engine, probe, token)
		switch {
		case len(checker.asked) == 0:
			ungated = append(ungated, fmt.Sprintf("%s %s (no permission consulted, answered %d)",
				rt.Method, rt.Path, code))
		case code != http.StatusForbidden:
			ungated = append(ungated, fmt.Sprintf("%s %s (asked for %s but answered %d, not 403)",
				rt.Method, rt.Path, strings.Join(checker.asked, "+"), code))
		}
	}
	if len(ungated) > 0 {
		t.Errorf("%d of %d administrative routes are not gated on a permission:\n  %s",
			len(ungated), len(routes), strings.Join(ungated, "\n  "))
	}
}

// TestAdministrativeRoutesConsultThePermissionOnce covers the cost of the gate.
//
// One route, one lookup. A route carrying the guard twice - easy to do when a
// group and a route both add one - would read admin_user_roles twice per
// request for no additional authority.
func TestAdministrativeRoutesConsultThePermissionOnce(t *testing.T) {
	checker := &recordingChecker{allow: true}
	engine := routerWithChecker(checker)
	token := tokenWithRole(t, middleware.RoleAdmin)

	var repeated []string
	for _, rt := range administrativeRoutes(engine) {
		checker.reset()
		probe := rt
		probe.Path = resolveParams(rt.Path)
		requestAs(engine, probe, token)
		if len(checker.asked) > 1 {
			repeated = append(repeated, fmt.Sprintf("%s %s asked %d times: %s",
				rt.Method, rt.Path, len(checker.asked), strings.Join(checker.asked, ", ")))
		}
	}
	if len(repeated) > 0 {
		t.Errorf("routes performing more than one permission lookup:\n  %s",
			strings.Join(repeated, "\n  "))
	}
}

// permissionMatrix maps each administrative route to the permission it demands,
// read out of the running router rather than out of the source.
func permissionMatrix(t *testing.T) []string {
	t.Helper()
	checker := &recordingChecker{allow: false}
	engine := routerWithChecker(checker)
	token := tokenWithRole(t, middleware.RoleAdmin)

	var lines []string
	for _, rt := range administrativeRoutes(engine) {
		checker.reset()
		probe := rt
		probe.Path = resolveParams(rt.Path)
		requestAs(engine, probe, token)
		asked := "<none>"
		if len(checker.asked) > 0 {
			asked = strings.Join(checker.asked, "+")
		}
		lines = append(lines, fmt.Sprintf("%-6s %-62s %s", rt.Method, rt.Path, asked))
	}
	sort.Strings(lines)
	return lines
}

// TestAdminPermissionMatrixIsPinned makes every change to the mapping visible.
//
// The golden file is the reviewable artefact: which permission each
// administrative route demands, in one place, regenerated from the router. A
// route added without a gate, or a route quietly moved from a .manage
// permission to a .read one, is a diff here rather than a discovery later.
func TestAdminPermissionMatrixIsPinned(t *testing.T) {
	golden := filepath.Join("testdata", "admin_permissions.golden")
	got := strings.Join(permissionMatrix(t), "\n") + "\n"

	if os.Getenv("UPDATE_GOLDEN") == "1" {
		if err := os.WriteFile(golden, []byte(got), 0o644); err != nil {
			t.Fatalf("write golden: %v", err)
		}
		return
	}

	want, err := os.ReadFile(golden)
	if err != nil {
		t.Fatalf("read %s: %v (regenerate with UPDATE_GOLDEN=1)", golden, err)
	}
	if string(want) != got {
		t.Errorf("the administrative permission matrix changed.\n"+
			"Review the difference, then regenerate with UPDATE_GOLDEN=1 go test ./internal/router/ -run AdminPermissionMatrix\n"+
			"%s", firstDifference(string(want), got))
	}
}

func firstDifference(want, got string) string {
	wantLines, gotLines := strings.Split(want, "\n"), strings.Split(got, "\n")
	for i := 0; i < len(wantLines) || i < len(gotLines); i++ {
		var w, g string
		if i < len(wantLines) {
			w = wantLines[i]
		}
		if i < len(gotLines) {
			g = gotLines[i]
		}
		if w != g {
			return fmt.Sprintf("  line %d\n    want: %q\n     got: %q", i+1, w, g)
		}
	}
	return ""
}

// TestEveryDemandedPermissionExists closes the gap between the routes and the
// vocabulary: a route may only ask for a permission the seed actually carries,
// or the narrowing it expresses is one nobody can ever grant.
func TestEveryDemandedPermissionExists(t *testing.T) {
	known := map[string]bool{}
	for _, code := range adminDomain.AllPermissions() {
		known[code] = true
	}

	checker := &recordingChecker{allow: false}
	engine := routerWithChecker(checker)
	token := tokenWithRole(t, middleware.RoleAdmin)

	unknown := map[string][]string{}
	for _, rt := range administrativeRoutes(engine) {
		checker.reset()
		probe := rt
		probe.Path = resolveParams(rt.Path)
		requestAs(engine, probe, token)
		for _, asked := range checker.asked {
			if !known[asked] {
				unknown[asked] = append(unknown[asked], rt.Method+" "+rt.Path)
			}
		}
	}
	for code, routes := range unknown {
		t.Errorf("route(s) demand %q, which is not a seeded permission: %s",
			code, strings.Join(routes, ", "))
	}
}

// TestReadOnlyAdminReachesNoWrite is the promise the role's name makes.
//
// read_only_admin is defined as every permission ending in .read and nothing
// else. Before enforcement reached past internal/admin that definition was true
// of one module and false of nineteen: the role was refused PUT /admin/users/:id
// and allowed POST /admin/backups/restore-confirm.
//
// The assertion is deliberately not "every GET succeeds": some reads are gated
// on a manage permission because what they return is itself sensitive - system
// settings, security detection rules. What must hold in every module is the
// other direction, that nothing which changes state is reachable.
func TestReadOnlyAdminReachesNoWrite(t *testing.T) {
	perms, ok := adminDomain.PermissionsForRole(adminDomain.RoleReadOnlyAdmin)
	if !ok {
		t.Fatal("read_only_admin is not a seeded role")
	}
	checker := checkerHolding(perms)
	engine := routerWithChecker(checker)
	token := tokenWithRole(t, middleware.RoleAdmin)

	var reachable []string
	for _, rt := range administrativeRoutes(engine) {
		if rt.Method == http.MethodGet || rt.Method == http.MethodHead {
			continue
		}
		probe := rt
		probe.Path = resolveParams(rt.Path)
		if code := requestAs(engine, probe, token); code != http.StatusForbidden {
			reachable = append(reachable, fmt.Sprintf("%s %s answered %d", rt.Method, rt.Path, code))
		}
	}
	if len(reachable) > 0 {
		t.Errorf("read_only_admin reached %d state-changing administrative routes:\n  %s",
			len(reachable), strings.Join(reachable, "\n  "))
	}
}

// TestNoAssignmentKeepsEveryAdministrator is the no-lockout guarantee.
//
// Every administrator in the product today has no row in admin_user_roles, so
// EffectivePermissions hands them everything. Extending enforcement to twenty
// more modules must not have changed that for a single route.
func TestNoAssignmentKeepsEveryAdministrator(t *testing.T) {
	checker := checkerHolding(adminDomain.EffectivePermissions(nil))
	engine := routerWithChecker(checker)

	for _, role := range middleware.AdminRoles() {
		t.Run(role, func(t *testing.T) {
			token := tokenWithRole(t, role)
			var denied []string
			for _, rt := range administrativeRoutes(engine) {
				probe := rt
				probe.Path = resolveParams(rt.Path)
				if code := requestAs(engine, probe, token); code == http.StatusForbidden {
					denied = append(denied, rt.Method+" "+rt.Path)
				}
			}
			if len(denied) > 0 {
				t.Errorf("an unassigned %q was refused %d administrative routes:\n  %s",
					role, len(denied), strings.Join(denied, "\n  "))
			}
		})
	}
}

// TestPermissionsNeverAdmitANonAdministrator states the direction of the whole
// arrangement: the inner gate can only refuse.
//
// The checker below grants every permission, which is the most permissive
// answer the permission system can give. An ordinary user must still be refused
// by RequireAdmin() ahead of it, on every route, with exactly 403 - not 401,
// which would mean the request was turned away for want of a token rather than
// for want of authority, and would let this test pass against a router whose
// role guard had been removed.
func TestPermissionsNeverAdmitANonAdministrator(t *testing.T) {
	engine := routerWithChecker(&recordingChecker{allow: true})

	for _, role := range []string{
		middleware.RoleUser,
		middleware.RoleRecruiter,
		middleware.RoleHiringManager,
		middleware.RoleModerator,
	} {
		t.Run(role, func(t *testing.T) {
			token := tokenWithRole(t, role)
			var admitted []string
			for _, rt := range administrativeRoutes(engine) {
				probe := rt
				probe.Path = resolveParams(rt.Path)
				if code := requestAs(engine, probe, token); code != http.StatusForbidden {
					admitted = append(admitted, fmt.Sprintf("%s %s answered %d",
						rt.Method, rt.Path, code))
				}
			}
			if len(admitted) > 0 {
				t.Errorf("%d administrative routes did not answer 403 to a %q:\n  %s",
					len(admitted), role, strings.Join(admitted, "\n  "))
			}
		})
	}
}

// TestGuardFailsClosedWithoutAChecker covers the wiring mistake.
//
// A router assembled without a permission checker cannot answer "may this
// administrator do this". It must not answer yes. 500 is the right code: the
// request failed, and reporting it as 403 would tell an administrator their
// access had been removed when the truth is that the server is misconfigured.
func TestGuardFailsClosedWithoutAChecker(t *testing.T) {
	engine := routerWithChecker(nil)
	token := tokenWithRole(t, middleware.RoleAdmin)

	var admitted []string
	for _, rt := range administrativeRoutes(engine) {
		probe := rt
		probe.Path = resolveParams(rt.Path)
		if code := requestAs(engine, probe, token); code != http.StatusInternalServerError {
			admitted = append(admitted, fmt.Sprintf("%s %s answered %d", rt.Method, rt.Path, code))
		}
	}
	if len(admitted) > 0 {
		t.Errorf("%d administrative routes did not fail closed without a permission checker:\n  %s",
			len(admitted), strings.Join(admitted, "\n  "))
	}

	// And the outer gate still runs first: no checker at all must not turn a
	// non-administrator's 403 into anything else.
	for _, rt := range administrativeRoutes(engine)[:1] {
		probe := rt
		probe.Path = resolveParams(rt.Path)
		if code := requestAs(engine, probe, tokenWithRole(t, middleware.RoleUser)); code != http.StatusForbidden {
			t.Errorf("%s %s answered %d to an ordinary user, want 403", rt.Method, rt.Path, code)
		}
	}
}

// TestPermissionLookupFailureIsNotADenial: a database that cannot be reached is
// an outage, not an authorization decision.
func TestPermissionLookupFailureIsNotADenial(t *testing.T) {
	engine := routerWithChecker(&recordingChecker{err: context.DeadlineExceeded})
	token := tokenWithRole(t, middleware.RoleAdmin)

	rt := gin.RouteInfo{Method: http.MethodGet, Path: "/api/v1/admin/backups"}
	if code := requestAs(engine, rt, token); code != http.StatusInternalServerError {
		t.Errorf("a failed permission lookup answered %d, want 500", code)
	}
}
