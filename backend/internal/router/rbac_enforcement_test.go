package router

import (
	"net/http"
	"net/http/httptest"
	"sort"
	"strings"
	"testing"
	"time"

	configPkg "kirmya/internal/shared/config"
	"kirmya/internal/shared/middleware"

	adminHttp "kirmya/internal/admin/delivery/http"
	analyticsHttp "kirmya/internal/analytics/delivery/http"
	authMiddleware "kirmya/internal/auth/middleware"
	authService "kirmya/internal/auth/service"
	backupHttp "kirmya/internal/backup/delivery/http"
	billingHttp "kirmya/internal/billing/delivery/http"
	companyHttp "kirmya/internal/company/delivery/http"
	complianceHttp "kirmya/internal/compliance/delivery/http"
	dataOpsHttp "kirmya/internal/data_operations/delivery/http"
	landingHttp "kirmya/internal/landing/delivery/http"
	legalHttp "kirmya/internal/legal/delivery/http"
	msgHttp "kirmya/internal/messaging/delivery/http"
	netHttp "kirmya/internal/networking/delivery/http"
	notifyHttp "kirmya/internal/notification/delivery/http"
	onboardingHttp "kirmya/internal/onboarding/delivery/http"
	profileHttp "kirmya/internal/profile/delivery/http"
	recommendationEngineHttp "kirmya/internal/recommendation_engine/delivery/http"
	securityHttp "kirmya/internal/security/delivery/http"
	supportHttp "kirmya/internal/support/delivery/http"
	sysHealthHttp "kirmya/internal/system_health/delivery/http"
	trustHttp "kirmya/internal/trust_safety/delivery/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// adminSurfaceRouter builds a router carrying every handler that registers an
// /admin/* group. Zero-value handlers are fine: these tests assert on which
// middleware a request survives, and a request that reaches a handler has
// already passed the guard, which is the thing under test.
func adminSurfaceRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return New(Handlers{
		AuthMiddleware:              authMiddleware.NewAuthMiddleware(&authService.AuthService{}),
		AdminHandler:                &adminHttp.AdminHandler{},
		AdminAnalyticsHandler:       &analyticsHttp.AdminAnalyticsHandler{},
		AnalyticsHandler:            &analyticsHttp.AnalyticsHandler{},
		AdminBackupHandler:          &backupHttp.BackupHandler{},
		BillingHandler:              &billingHttp.BillingHandler{},
		AdminBillingHandler:         &billingHttp.AdminBillingHandler{},
		CompanyHandler:              &companyHttp.CompanyHandler{},
		CompanyManagementHandler:    &companyHttp.ManagementHandler{},
		ComplianceHandler:           &complianceHttp.ComplianceHandler{},
		DataOperationsHandler:       &dataOpsHttp.DataOperationsHandler{},
		LandingHandler:              &landingHttp.LandingHandler{},
		LegalHandler:                &legalHttp.LegalHandler{},
		AdminLegalHandler:           &legalHttp.AdminLegalHandler{},
		MessagingHandler:            &msgHttp.MessagingHandler{},
		NetworkingHandler:           &netHttp.NetworkingHandler{},
		NotificationHandler:         &notifyHttp.NotificationHandler{},
		OnboardingHandler:           &onboardingHttp.OnboardingHandler{},
		ProfileHandler:              &profileHttp.ProfileHandler{},
		RecommendationEngineHandler: &recommendationEngineHttp.RecommendationHandler{},
		SecurityHandler:             &securityHttp.SecurityHandler{},
		AdminSecurityHandler:        &securityHttp.AdminSecurityHandler{},
		SupportHandler:              &supportHttp.SupportHandler{},
		AdminSupportHandler:         &supportHttp.AdminSupportHandler{},
		SystemHealthHandler:         &sysHealthHttp.SystemHealthHandler{},
		TrustHandler:                &trustHttp.TrustHandler{},
		TrustSafetyHandler:          &trustHttp.TrustSafetyHandler{},
		AdminTrustSafetyHandler:     &trustHttp.AdminTrustSafetyHandler{},
	}, SwaggerConfig{})
}

func tokenWithRole(t *testing.T, role string) string {
	t.Helper()
	claims := middleware.JWTClaims{
		UserID: uuid.New(),
		Email:  "probe@example.com",
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString(configPkg.GetJWTSecretBytes())
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return signed
}

// resolveParams substitutes a syntactically valid UUID for every :param and a
// path segment for any *wildcard, so a parameterised route can be requested for
// real. A guard runs before the handler parses anything, so the value only has
// to be well formed, not to exist.
func resolveParams(path string) string {
	segs := strings.Split(path, "/")
	for i, s := range segs {
		switch {
		case strings.HasPrefix(s, ":"):
			segs[i] = "00000000-0000-0000-0000-000000000001"
		case strings.HasPrefix(s, "*"):
			segs[i] = "probe"
		}
	}
	return strings.Join(segs, "/")
}

// adminRoutes lists every admin path on the built router, parameterised ones
// included. An earlier version of this test skipped anything containing ":",
// which left 64 admin routes unverified — among them the whole
// /admin/users/:id/profile group and the security incident and alert endpoints.
// Skipping the routes that carry an object identifier skipped exactly the ones
// where an authorization mistake is most costly.
func adminRoutes(engine *gin.Engine) []gin.RouteInfo {
	var out []gin.RouteInfo
	for _, rt := range engine.Routes() {
		if strings.HasPrefix(rt.Path, "/api/v1/admin/") {
			rt.Path = resolveParams(rt.Path)
			out = append(out, rt)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Path+out[i].Method < out[j].Path+out[j].Method })
	return out
}

func requestAs(engine *gin.Engine, rt gin.RouteInfo, bearer string) int {
	req := httptest.NewRequest(rt.Method, rt.Path, nil)
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec.Code
}

// TestEveryAdminRouteRejectsNonAdmins is the enforcement test for the whole
// administrative surface. It walks the real route table rather than a list
// maintained by hand, so an admin group added later without a role guard fails
// here instead of shipping.
func TestEveryAdminRouteRejectsNonAdmins(t *testing.T) {
	engine := adminSurfaceRouter()
	routes := adminRoutes(engine)
	if len(routes) < 230 {
		t.Fatalf("only %d admin routes discovered; the router is not fully built "+
			"and this test would pass vacuously", len(routes))
	}

	for _, role := range []string{
		middleware.RoleUser,
		middleware.RoleRecruiter,
		middleware.RoleHiringManager,
		middleware.RoleModerator,
	} {
		t.Run(role, func(t *testing.T) {
			token := tokenWithRole(t, role)
			var reachable []string
			for _, rt := range routes {
				if code := requestAs(engine, rt, token); code != http.StatusForbidden {
					reachable = append(reachable, rt.Method+" "+rt.Path)
				}
			}
			if len(reachable) > 0 {
				t.Errorf("%d admin routes did not return 403 to a %q:\n  %s",
					len(reachable), role, strings.Join(reachable, "\n  "))
			}
		})
	}
}

// TestEveryAdminRouteRejectsAnonymous: no token at all must be 401, not 403 and
// certainly not a handler invocation.
func TestEveryAdminRouteRejectsAnonymous(t *testing.T) {
	engine := adminSurfaceRouter()

	var reachable []string
	for _, rt := range adminRoutes(engine) {
		if code := requestAs(engine, rt, ""); code != http.StatusUnauthorized {
			reachable = append(reachable, rt.Method+" "+rt.Path)
		}
	}
	if len(reachable) > 0 {
		t.Errorf("%d admin routes did not return 401 to an anonymous caller:\n  %s",
			len(reachable), strings.Join(reachable, "\n  "))
	}
}

// TestAdminRolesReachAdminRoutes is the other half: the guards must not have
// locked out the people who are supposed to get in.
func TestAdminRolesReachAdminRoutes(t *testing.T) {
	engine := adminSurfaceRouter()
	routes := adminRoutes(engine)

	for _, role := range middleware.AdminRoles() {
		t.Run(role, func(t *testing.T) {
			token := tokenWithRole(t, role)
			var blocked []string
			for _, rt := range routes {
				code := requestAs(engine, rt, token)
				if code == http.StatusForbidden || code == http.StatusUnauthorized {
					blocked = append(blocked, rt.Method+" "+rt.Path)
				}
			}
			if len(blocked) > 0 {
				t.Errorf("%d admin routes rejected a %q:\n  %s",
					len(blocked), role, strings.Join(blocked, "\n  "))
			}
		})
	}
}

// TestTrustModerationActionRequiresAdmin covers the one user-facing route that
// carries an administrative capability. It lives under /trust, not /admin, so
// the sweeps above do not reach it.
func TestTrustModerationActionRequiresAdmin(t *testing.T) {
	engine := adminSurfaceRouter()
	const path = "/api/v1/trust/reports/abc/action"

	if code := requestAs(engine, gin.RouteInfo{Method: http.MethodPost, Path: path},
		tokenWithRole(t, middleware.RoleUser)); code != http.StatusForbidden {
		t.Errorf("ordinary user got %d on the moderation action, want 403", code)
	}
	if code := requestAs(engine, gin.RouteInfo{Method: http.MethodPost, Path: path},
		tokenWithRole(t, middleware.RoleAdmin)); code == http.StatusForbidden {
		t.Error("admin was denied the moderation action")
	}
}

// TestUserScopedRoutesStayReachable is the no-breaking-change guard: tightening
// the admin surface must not have caught ordinary user routes in the net.
func TestUserScopedRoutesStayReachable(t *testing.T) {
	engine := adminSurfaceRouter()
	token := tokenWithRole(t, middleware.RoleUser)

	for _, rt := range []gin.RouteInfo{
		{Method: http.MethodGet, Path: "/api/v1/notifications"},
		{Method: http.MethodGet, Path: "/api/v1/messages/conversations"},
		{Method: http.MethodGet, Path: "/api/v1/support/tickets"},
		{Method: http.MethodGet, Path: "/api/v1/onboarding/status"},
		{Method: http.MethodGet, Path: "/api/v1/trust/reports"},
	} {
		if code := requestAs(engine, rt, token); code == http.StatusForbidden {
			t.Errorf("%s %s returned 403 to an ordinary user; a user route was caught by an admin guard",
				rt.Method, rt.Path)
		}
	}
}

// TestPublicRoutesStayPublic: routes that are public by design must not have
// acquired a guard.
func TestPublicRoutesStayPublic(t *testing.T) {
	engine := adminSurfaceRouter()

	for _, rt := range []gin.RouteInfo{
		{Method: http.MethodGet, Path: "/api/v1/landing/content"},
	} {
		code := requestAs(engine, rt, "")
		if code == http.StatusUnauthorized || code == http.StatusForbidden {
			t.Errorf("%s %s returned %d without a token; it is meant to be public",
				rt.Method, rt.Path, code)
		}
	}
}

// TestProfileAdminRoutesRequireAdmin pins the profile administration group by
// name. It is covered by the sweep above too, but only since parameterised
// routes were included — before that this entire group was unverified, and a
// named test makes a future regression here read as what it is rather than as
// one line in a list of 241.
func TestProfileAdminRoutesRequireAdmin(t *testing.T) {
	engine := adminSurfaceRouter()
	const base = "/api/v1/admin/users/00000000-0000-0000-0000-000000000001/profile"

	routes := []gin.RouteInfo{
		{Method: http.MethodGet, Path: base},
		{Method: http.MethodPut, Path: base},
		{Method: http.MethodPost, Path: base + "/verify"},
		{Method: http.MethodPost, Path: base + "/restrict"},
	}

	for _, rt := range routes {
		if code := requestAs(engine, rt, tokenWithRole(t, middleware.RoleUser)); code != http.StatusForbidden {
			t.Errorf("%s %s returned %d to an ordinary user, want 403", rt.Method, rt.Path, code)
		}
		if code := requestAs(engine, rt, ""); code != http.StatusUnauthorized {
			t.Errorf("%s %s returned %d to an anonymous caller, want 401", rt.Method, rt.Path, code)
		}
		if code := requestAs(engine, rt, tokenWithRole(t, middleware.RoleAdmin)); code == http.StatusForbidden {
			t.Errorf("%s %s denied an admin", rt.Method, rt.Path)
		}
	}
}

// TestSecurityAdminRoutesRequireAdmin pins the administrative security surface:
// incident and alert records, platform security settings and detection rules.
func TestSecurityAdminRoutesRequireAdmin(t *testing.T) {
	engine := adminSurfaceRouter()
	const id = "00000000-0000-0000-0000-000000000001"

	routes := []gin.RouteInfo{
		{Method: http.MethodGet, Path: "/api/v1/admin/security"},
		{Method: http.MethodGet, Path: "/api/v1/admin/security/incidents"},
		{Method: http.MethodPost, Path: "/api/v1/admin/security/incidents"},
		{Method: http.MethodGet, Path: "/api/v1/admin/security/incidents/" + id},
		{Method: http.MethodPut, Path: "/api/v1/admin/security/incidents/" + id},
		{Method: http.MethodGet, Path: "/api/v1/admin/security/settings"},
		{Method: http.MethodPut, Path: "/api/v1/admin/security/settings"},
		{Method: http.MethodGet, Path: "/api/v1/admin/security/alerts/" + id},
		{Method: http.MethodPut, Path: "/api/v1/admin/security/rules/" + id},
		{Method: http.MethodGet, Path: "/api/v1/admin/security/risk-scores"},
	}

	for _, rt := range routes {
		if code := requestAs(engine, rt, tokenWithRole(t, middleware.RoleUser)); code != http.StatusForbidden {
			t.Errorf("%s %s returned %d to an ordinary user, want 403", rt.Method, rt.Path, code)
		}
		if code := requestAs(engine, rt, tokenWithRole(t, middleware.RoleModerator)); code != http.StatusForbidden {
			t.Errorf("%s %s returned %d to a moderator, want 403", rt.Method, rt.Path, code)
		}
	}
}

// TestSecurityUserRoutesStayUserScoped is the counterpart: the self-service
// security endpoints must NOT acquire an admin guard. They are protected by
// ownership checks in the service (see security_idor_test.go), not by role, and
// gating them on admin would lock every user out of their own account settings.
func TestSecurityUserRoutesStayUserScoped(t *testing.T) {
	engine := adminSurfaceRouter()
	token := tokenWithRole(t, middleware.RoleUser)

	for _, rt := range []gin.RouteInfo{
		{Method: http.MethodGet, Path: "/api/v1/security"},
		{Method: http.MethodGet, Path: "/api/v1/security/sessions"},
		{Method: http.MethodGet, Path: "/api/v1/security/devices"},
		{Method: http.MethodGet, Path: "/api/v1/security/api-keys"},
		{Method: http.MethodGet, Path: "/api/v1/security/login-history"},
		{Method: http.MethodGet, Path: "/api/v1/privacy/settings"},
	} {
		if code := requestAs(engine, rt, token); code == http.StatusForbidden {
			t.Errorf("%s %s returned 403 to an ordinary user; a self-service security "+
				"route was caught by an admin guard", rt.Method, rt.Path)
		}
		if code := requestAs(engine, rt, ""); code != http.StatusUnauthorized {
			t.Errorf("%s %s returned %d anonymously, want 401", rt.Method, rt.Path, code)
		}
	}
}
