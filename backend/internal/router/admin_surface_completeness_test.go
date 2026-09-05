package router

import (
	"net/http"
	"reflect"
	"sort"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"kirmya/internal/shared/middleware"
)

// The RBAC sweep in rbac_enforcement_test.go builds its router from a handler
// list written by hand. A route only exists on a gin engine if its handler was
// non-nil at registration, so any admin handler missing from that list is a
// group of routes the sweep silently does not test — and "silently" is the
// problem: the sweep still passes.
//
// fullyPopulatedRouter removes the hand-written list from the equation. It
// fills every pointer field on RouterDependencies by reflection, so a handler
// added to the struct next month is covered here the day it is added, without
// anyone remembering to update a test.

func fullyPopulatedRouter(t *testing.T) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)

	deps := RouterDependencies{}
	v := reflect.ValueOf(&deps).Elem()
	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		if field.Kind() == reflect.Ptr && field.Type().Elem().Kind() == reflect.Struct && field.CanSet() {
			field.Set(reflect.New(field.Type().Elem()))
		}
	}

	return New(deps, SwaggerConfig{})
}

func adminPathsOf(engine *gin.Engine) map[string]bool {
	paths := map[string]bool{}
	for _, rt := range engine.Routes() {
		if strings.HasPrefix(rt.Path, "/api/v1/admin/") {
			paths[rt.Method+" "+rt.Path] = true
		}
	}
	return paths
}

// TestRBACSweepCoversEveryAdminRoute is the meta-test: it fails when the
// hand-written handler list in adminSurfaceRouter stops covering the admin
// surface that a fully wired router exposes.
func TestRBACSweepCoversEveryAdminRoute(t *testing.T) {
	swept := adminPathsOf(adminSurfaceRouter())
	all := adminPathsOf(fullyPopulatedRouter(t))

	var uncovered []string
	for route := range all {
		if !swept[route] {
			uncovered = append(uncovered, route)
		}
	}
	sort.Strings(uncovered)

	if len(uncovered) > 0 {
		t.Errorf("%d admin routes exist on a fully wired router but are absent from the "+
			"RBAC sweep, so nothing verifies their authorization:\n  %s",
			len(uncovered), strings.Join(uncovered, "\n  "))
	}
	t.Logf("admin surface: %d routes on a fully wired router, %d covered by the sweep",
		len(all), len(swept))
}

// TestEveryAdminRouteOnAFullyWiredRouterIsGuarded is the sweep itself, run
// against every handler the dependency struct has rather than a chosen subset.
// This is the claim "every /admin/* route requires an admin role", tested
// without a curated list standing between the assertion and the router.
func TestEveryAdminRouteOnAFullyWiredRouterIsGuarded(t *testing.T) {
	engine := fullyPopulatedRouter(t)

	var routes []gin.RouteInfo
	for _, rt := range engine.Routes() {
		if strings.HasPrefix(rt.Path, "/api/v1/admin/") {
			rt.Path = resolveParams(rt.Path)
			routes = append(routes, rt)
		}
	}
	if len(routes) < 230 {
		t.Fatalf("only %d admin routes discovered; this test would pass vacuously", len(routes))
	}

	var anonymousReachable, userReachable []string
	userToken := tokenWithRole(t, middleware.RoleUser)

	for _, rt := range routes {
		if code := requestAs(engine, rt, ""); code != http.StatusUnauthorized {
			anonymousReachable = append(anonymousReachable, rt.Method+" "+rt.Path)
		}
		if code := requestAs(engine, rt, userToken); code != http.StatusForbidden {
			userReachable = append(userReachable, rt.Method+" "+rt.Path)
		}
	}

	sort.Strings(anonymousReachable)
	sort.Strings(userReachable)

	if len(anonymousReachable) > 0 {
		t.Errorf("%d admin routes did not return 401 to an anonymous caller:\n  %s",
			len(anonymousReachable), strings.Join(anonymousReachable, "\n  "))
	}
	if len(userReachable) > 0 {
		t.Errorf("%d admin routes did not return 403 to an ordinary user:\n  %s",
			len(userReachable), strings.Join(userReachable, "\n  "))
	}
}

// TestFullyWiredRouterRegistersWithoutPanicking covers the failure that reached
// production once already: gin panics at registration on a duplicate route, and
// a router test that wires only some handlers never registers the pair that
// collides. Building with every handler populated is the check that would have
// caught it.
func TestFullyWiredRouterRegistersWithoutPanicking(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("building a fully wired router panicked: %v", r)
		}
	}()

	engine := fullyPopulatedRouter(t)
	if len(engine.Routes()) == 0 {
		t.Fatal("a fully wired router registered no routes")
	}
	t.Logf("fully wired router registers %d routes", len(engine.Routes()))
}
