package router

import (
	"net/http"
	"testing"

	"kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
)

// Billing routes are covered by the /admin/* sweep in rbac_enforcement_test.go,
// but money endpoints are worth pinning by name: a regression here reads as
// "anyone can see platform revenue" rather than as one line in a list of 241.
//
// These run against the router as assembled in production, which wires the
// authenticated billing group through AuthMiddleware.RequireAuth rather than
// the shared fallback the billing package's own tests exercise. Both paths need
// to hold.

func TestAdminBillingRoutesRequireAdmin(t *testing.T) {
	engine := adminSurfaceRouter()

	routes := []gin.RouteInfo{
		{Method: http.MethodGet, Path: "/api/v1/admin/billing/status"},
		{Method: http.MethodGet, Path: "/api/v1/admin/billing/plans"},
		{Method: http.MethodGet, Path: "/api/v1/admin/billing/entitlements"},
		{Method: http.MethodGet, Path: "/api/v1/admin/billing/analytics"},
	}

	for _, rt := range routes {
		if code := requestAs(engine, rt, ""); code != http.StatusUnauthorized {
			t.Errorf("%s %s returned %d anonymously, want 401", rt.Method, rt.Path, code)
		}
		for _, role := range []string{
			middleware.RoleUser,
			middleware.RoleRecruiter,
			middleware.RoleHiringManager,
			middleware.RoleModerator,
		} {
			if code := requestAs(engine, rt, tokenWithRole(t, role)); code != http.StatusForbidden {
				t.Errorf("%s %s returned %d to a %q, want 403", rt.Method, rt.Path, code, role)
			}
		}
		// The guard must not have locked out the people it is for. The handler
		// itself is a zero value here, so anything other than a rejection means
		// the request got past the middleware, which is what is being asserted.
		for _, role := range middleware.AdminRoles() {
			code := requestAs(engine, rt, tokenWithRole(t, role))
			if code == http.StatusForbidden || code == http.StatusUnauthorized {
				t.Errorf("%s %s returned %d to a %q; an admin was denied", rt.Method, rt.Path, code, role)
			}
		}
	}
}

// TestUserBillingRoutesRequireAuthentication covers the per-account endpoints
// as the production router wires them: subscription state and checkout are not
// readable without a verified token.
func TestUserBillingRoutesRequireAuthentication(t *testing.T) {
	engine := adminSurfaceRouter()

	for _, rt := range []gin.RouteInfo{
		{Method: http.MethodGet, Path: "/api/v1/billing/status"},
		{Method: http.MethodGet, Path: "/api/v1/billing/subscription"},
		{Method: http.MethodPost, Path: "/api/v1/billing/checkout"},
	} {
		if code := requestAs(engine, rt, ""); code != http.StatusUnauthorized {
			t.Errorf("%s %s returned %d without a token, want 401", rt.Method, rt.Path, code)
		}
		// An ordinary user is exactly who these are for: they must not have
		// been swept up by an admin guard.
		if code := requestAs(engine, rt, tokenWithRole(t, middleware.RoleUser)); code == http.StatusForbidden {
			t.Errorf("%s %s returned 403 to an ordinary user; a self-service billing route "+
				"was caught by an admin guard", rt.Method, rt.Path)
		}
	}
}

// TestBillingPublicRoutesStayPublic guards the other direction. The price list
// and the provider webhook are public by necessity — a payment provider has no
// user token to present — and must not acquire an auth guard that would make
// the platform silently stop receiving payment events.
func TestBillingPublicRoutesStayPublic(t *testing.T) {
	engine := adminSurfaceRouter()

	for _, rt := range []gin.RouteInfo{
		{Method: http.MethodGet, Path: "/api/v1/billing/plans"},
		{Method: http.MethodPost, Path: "/api/v1/billing/webhooks/stripe"},
	} {
		if code := requestAs(engine, rt, ""); code == http.StatusUnauthorized || code == http.StatusForbidden {
			t.Errorf("%s %s returned %d anonymously; it is public by design and its "+
				"protection is the payload signature, not a token", rt.Method, rt.Path, code)
		}
	}
}
