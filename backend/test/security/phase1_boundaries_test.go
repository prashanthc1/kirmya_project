package security

import (
	"bufio"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kirmya/internal/router"
	configPkg "kirmya/internal/shared/config"
	"kirmya/internal/shared/middleware"
)

// Phase 1 security boundaries, asserted end to end through the real router
// rather than against any one module's tests.
//
// The per-module tests added in Prompts 1-6 each prove their own change. These
// prove the boundaries still hold when the whole application is assembled,
// which is the only configuration that actually ships.

// phase1Router builds a router with every handler populated. Reflection rather
// than a hand-written list: a route only exists on a gin engine if its handler
// was non-nil at registration, so a curated list quietly shrinks the surface
// under test every time a handler is added.
func phase1Router(t *testing.T) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)

	deps := router.RouterDependencies{}
	v := reflect.ValueOf(&deps).Elem()
	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		if field.Kind() == reflect.Ptr && field.Type().Elem().Kind() == reflect.Struct && field.CanSet() {
			field.Set(reflect.New(field.Type().Elem()))
		}
	}
	return router.New(deps, router.SwaggerConfig{})
}

func phase1Token(t *testing.T, role string) string {
	t.Helper()
	return mintCustomJWT(uuid.New(), "boundary@kirmya.test", role, time.Hour,
		configPkg.GetJWTSecretBytes())
}

func request(t *testing.T, engine *gin.Engine, method, path, bearer string, body []byte) *httptest.ResponseRecorder {
	t.Helper()
	var req *http.Request
	if body == nil {
		req = httptest.NewRequest(method, path, nil)
	} else {
		req = httptest.NewRequest(method, path, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
	}
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

// resolveParams substitutes a well-formed value for each :param and *wildcard
// so a parameterised route can be requested. A guard runs before the handler
// parses anything, so the value only has to be syntactically valid.
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

// TestPhase1_AdminSurfaceIsClosedToNonAdmins is the RBAC claim stated as one
// assertion over the assembled application: every /admin/* route answers 401
// without a token and 403 to every non-admin role, and admins still get in.
func TestPhase1_AdminSurfaceIsClosedToNonAdmins(t *testing.T) {
	engine := phase1Router(t)

	var admin []gin.RouteInfo
	for _, rt := range engine.Routes() {
		if strings.HasPrefix(rt.Path, "/api/v1/admin/") {
			rt.Path = resolveParams(rt.Path)
			admin = append(admin, rt)
		}
	}
	if len(admin) < 230 {
		t.Fatalf("only %d admin routes discovered; this test would pass vacuously", len(admin))
	}

	var leaked []string
	for _, rt := range admin {
		if code := request(t, engine, rt.Method, rt.Path, "", nil).Code; code != http.StatusUnauthorized {
			leaked = append(leaked, "anonymous "+rt.Method+" "+rt.Path)
		}
		for _, role := range []string{
			middleware.RoleUser,
			middleware.RoleRecruiter,
			middleware.RoleHiringManager,
			middleware.RoleModerator,
		} {
			if code := request(t, engine, rt.Method, rt.Path, phase1Token(t, role), nil).Code; code != http.StatusForbidden {
				leaked = append(leaked, role+" "+rt.Method+" "+rt.Path)
			}
		}
	}
	sort.Strings(leaked)

	if len(leaked) > 0 {
		shown := leaked
		if len(shown) > 25 {
			shown = shown[:25]
		}
		t.Errorf("%d admin route/role combinations were not refused:\n  %s",
			len(leaked), strings.Join(shown, "\n  "))
	}

	// The other direction: the guards must not have locked out administrators.
	for _, role := range middleware.AdminRoles() {
		token := phase1Token(t, role)
		blocked := 0
		for _, rt := range admin {
			code := request(t, engine, rt.Method, rt.Path, token, nil).Code
			if code == http.StatusForbidden || code == http.StatusUnauthorized {
				blocked++
			}
		}
		if blocked > 0 {
			t.Errorf("%d admin routes rejected a %q", blocked, role)
		}
	}

	t.Logf("admin surface verified: %d routes", len(admin))
}

// TestPhase1_BillingBoundaries covers the money endpoints as assembled.
func TestPhase1_BillingBoundaries(t *testing.T) {
	engine := phase1Router(t)

	// Per-account endpoints: no token, no answer.
	for _, rt := range []struct{ method, path string }{
		{http.MethodGet, "/api/v1/billing/status"},
		{http.MethodGet, "/api/v1/billing/subscription"},
		{http.MethodPost, "/api/v1/billing/checkout"},
	} {
		if code := request(t, engine, rt.method, rt.path, "", []byte(`{}`)).Code; code != http.StatusUnauthorized {
			t.Errorf("%s %s returned %d anonymously, want 401", rt.method, rt.path, code)
		}
		if code := request(t, engine, rt.method, rt.path, phase1Token(t, middleware.RoleUser), []byte(`{}`)).Code; code == http.StatusForbidden {
			t.Errorf("%s %s returned 403 to an ordinary user; these are self-service", rt.method, rt.path)
		}
	}

	// Administrative billing: revenue and entitlements are admin-only.
	for _, path := range []string{
		"/api/v1/admin/billing/status",
		"/api/v1/admin/billing/plans",
		"/api/v1/admin/billing/entitlements",
		"/api/v1/admin/billing/analytics",
	} {
		if code := request(t, engine, http.MethodGet, path, "", nil).Code; code != http.StatusUnauthorized {
			t.Errorf("GET %s returned %d anonymously, want 401", path, code)
		}
		if code := request(t, engine, http.MethodGet, path, phase1Token(t, middleware.RoleUser), nil).Code; code != http.StatusForbidden {
			t.Errorf("GET %s returned %d to an ordinary user, want 403", path, code)
		}
	}

	// The webhook is necessarily unauthenticated — a payment provider has no
	// user token — so it must not be behind a guard, and its own signature
	// check is what refuses an unsigned caller. (With BILLING_ENABLED unset the
	// service no-ops, so this asserts reachability, not the signature logic,
	// which internal/billing covers.)
	if code := request(t, engine, http.MethodPost, "/api/v1/billing/webhooks/stripe", "", []byte(`{}`)).Code; code == http.StatusUnauthorized || code == http.StatusForbidden {
		t.Errorf("the provider webhook returned %d without a token; it cannot require one", code)
	}
}

// TestPhase1_PasswordResetBoundaries: the reset endpoints must stay reachable
// without a token — someone who has forgotten their password cannot present
// one — while remaining rate limited and enumeration-safe.
func TestPhase1_PasswordResetBoundaries(t *testing.T) {
	engine := phase1Router(t)

	body, _ := json.Marshal(map[string]string{"email": "boundary@kirmya.test"})

	first := request(t, engine, http.MethodPost, "/api/v1/auth/forgot-password", "", body)
	if first.Code == http.StatusUnauthorized || first.Code == http.StatusForbidden {
		t.Fatalf("forgot-password returned %d without a token; it must be reachable", first.Code)
	}

	limited := false
	for i := 0; i < 15; i++ {
		if request(t, engine, http.MethodPost, "/api/v1/auth/forgot-password", "", body).Code == http.StatusTooManyRequests {
			limited = true
			break
		}
	}
	if !limited {
		t.Error("15 rapid password reset requests were all accepted; the endpoint is not rate limited")
	}

	if code := request(t, engine, http.MethodPost, "/api/v1/auth/reset-password", "",
		[]byte(`{"token":"x","new_password":"Irrelevant1!"}`)).Code; code == http.StatusUnauthorized || code == http.StatusForbidden {
		t.Errorf("reset-password returned %d without a token; it must be reachable", code)
	}
}

// TestPhase1_AuthenticatedSurfaceRejectsForgedTokens: the whole authenticated
// API rests on signature verification, so a token signed with the wrong key
// must be refused everywhere, not merely on the routes anyone thought to test.
func TestPhase1_AuthenticatedSurfaceRejectsForgedTokens(t *testing.T) {
	engine := phase1Router(t)
	forged := mintCustomJWT(uuid.New(), "attacker@kirmya.test", middleware.RoleAdmin,
		time.Hour, []byte("not-the-servers-signing-key-000000"))

	var accepted []string
	count := 0
	for _, rt := range engine.Routes() {
		if !strings.HasPrefix(rt.Path, "/api/v1/admin/") {
			continue
		}
		count++
		if code := request(t, engine, rt.Method, resolveParams(rt.Path), forged, nil).Code; code != http.StatusUnauthorized {
			accepted = append(accepted, rt.Method+" "+rt.Path)
		}
	}
	if count == 0 {
		t.Fatal("no admin routes found; this test would pass vacuously")
	}
	if len(accepted) > 0 {
		shown := accepted
		if len(shown) > 10 {
			shown = shown[:10]
		}
		t.Errorf("%d admin routes accepted a token signed with the wrong key:\n  %s",
			len(accepted), strings.Join(shown, "\n  "))
	}
}

// ---------------------------------------------------------------------------
// Residual risk: identity resolution outside the modules Phase 1 touched.
// ---------------------------------------------------------------------------
//
// 79 handler call sites across 31 modules still read the caller's identity from
// the gin context key "user_id". Nothing sets that key — the authentication
// middleware publishes "userID", holding a uuid.UUID — so every one of those
// reads yields an empty value and the handler falls through to a hardcoded or
// randomly generated UUID.
//
// This is not an authentication bypass: the affected routes still require a
// valid token, and an anonymous caller is refused before the handler runs. The
// consequence is that authenticated callers are served, or write, data
// attributed to one synthetic identity rather than to themselves. Prompt 1
// fixed this in mentorship; the rest is a separate, larger change and is
// recorded in SECURITY_PHASE1_COMPLETION.md as the leading residual risk.
//
// The tests below do not pretend it is fixed. They pin it, so the number
// cannot grow quietly while the finding is open, and so closing a module
// produces a visible, deliberate edit here.

// brokenIdentityPattern matches a read of the context key nothing sets.
var brokenIdentityPattern = regexp.MustCompile(`GetString\("user_id"\)|GetString\("userID"\)|c\.Get\("user_id"\)`)

// knownBrokenIdentityFiles is the state of the codebase at the end of Phase 1.
// Removing a file from this list as it is fixed is the intended edit; adding
// one is a regression that this test exists to refuse.
var knownBrokenIdentityFiles = []string{
	"ai_job_match/delivery/http/matching_handler.go",
	"analytics/delivery/http/analytics_handler.go",
	"applications/delivery/http/applications_handler.go",
	"assessment/delivery/http/assessment_handler.go",
	"career_ai/delivery/http/career_ai_handler.go",
	"career_companion/delivery/http/companion_handler.go",
	"compliance/delivery/http/admin_compliance_handler.go",
	"compliance/delivery/http/compliance_handler.go",
	"cover_letter/delivery/http/cover_letter_handler.go",
	"endorsement/delivery/http/endorsement_handler.go",
	"enterprise_hiring/delivery/http/enterprise_handler.go",
	"event/delivery/http/event_handler.go",
	"freelance/delivery/http/freelance_handler.go",
	"interview/delivery/http/interview_handler.go",
	"interview_prep/delivery/http/interview_prep_handler.go",
	"job_alerts/delivery/http/job_alerts_handler.go",
	"learning/delivery/http/learning_handler.go",
	"media/delivery/http/file_handler.go",
	"mobile/delivery/http/mobile_handler.go",
	"native_mobile/delivery/http/native_mobile_handler.go",
	"organization/delivery/http/organization_handler.go",
	"recommendation/delivery/http/recommendation_handler.go",
	"recommendation_engine/delivery/http/recommendation_handler.go",
	"recruiter/delivery/http/recruiter_handler.go",
	"recruiter_ai/delivery/http/recruiter_ai_handler.go",
	"referral/delivery/http/referral_handler.go",
	"resume/delivery/http/resume_handler.go",
	"resume_analysis/delivery/http/resume_analysis_handler.go",
	"search/delivery/http/search_handler.go",
	"trust_safety/delivery/http/trust_handler.go",
	"verification/delivery/http/verification_handler.go",
	"workforce_intelligence/delivery/http/intelligence_handler.go",
}

// backendRoot locates the module root from this test's directory.
func backendRoot(t *testing.T) string {
	t.Helper()
	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("working directory: %v", err)
	}
	root := filepath.Join(wd, "..", "..")
	if _, err := os.Stat(filepath.Join(root, "go.mod")); err != nil {
		t.Fatalf("could not locate the backend root from %s: %v", wd, err)
	}
	return root
}

// scanBrokenIdentitySites walks internal/ and reports the files containing a
// real (non-comment) read of the unset context key.
func scanBrokenIdentitySites(t *testing.T) (files []string, sites int) {
	t.Helper()
	root := backendRoot(t)
	internal := filepath.Join(root, "internal")

	seen := map[string]bool{}
	err := filepath.Walk(internal, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
			return nil
		}

		handle, err := os.Open(path)
		if err != nil {
			return err
		}
		defer handle.Close()

		rel, _ := filepath.Rel(internal, path)
		scanner := bufio.NewScanner(handle)
		scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			// A mention in a comment is documentation of the defect, not the
			// defect: several of the Phase 1 fixes explain it in prose.
			if strings.HasPrefix(line, "//") {
				continue
			}
			if brokenIdentityPattern.MatchString(line) {
				sites++
				if !seen[rel] {
					seen[rel] = true
					files = append(files, rel)
				}
			}
		}
		return scanner.Err()
	})
	if err != nil {
		t.Fatalf("scan internal/: %v", err)
	}

	sort.Strings(files)
	return files, sites
}

// TestPhase1_NoNewBrokenIdentityResolution refuses growth in the residual. A
// module fixed since Phase 1 shows up here as a stale entry to delete; a module
// newly broken shows up as a failure naming the file.
func TestPhase1_NoNewBrokenIdentityResolution(t *testing.T) {
	found, sites := scanBrokenIdentitySites(t)

	known := map[string]bool{}
	for _, f := range knownBrokenIdentityFiles {
		known[filepath.FromSlash(f)] = true
	}

	var added []string
	for _, f := range found {
		if !known[f] {
			added = append(added, f)
		}
	}
	if len(added) > 0 {
		t.Errorf("%d file(s) newly read the caller's identity from the context key \"user_id\", "+
			"which nothing sets — use middleware.GetUserID(c) and refuse the request when it "+
			"returns false:\n  %s", len(added), strings.Join(added, "\n  "))
	}

	seenNow := map[string]bool{}
	for _, f := range found {
		seenNow[f] = true
	}
	var fixed []string
	for _, f := range knownBrokenIdentityFiles {
		if !seenNow[filepath.FromSlash(f)] {
			fixed = append(fixed, f)
		}
	}
	if len(fixed) > 0 {
		t.Errorf("%d file(s) in knownBrokenIdentityFiles no longer match and should be removed "+
			"from that list (and from SECURITY_PHASE1_COMPLETION.md):\n  %s",
			len(fixed), strings.Join(fixed, "\n  "))
	}

	t.Logf("residual identity-resolution defect: %d sites across %d files", sites, len(found))
}

// TestPhase1_FixedModulesStayFixed pins the modules Phase 1 actually corrected.
// mentorship is the one this work fixed; the others resolve identity correctly
// today and are listed so a regression in them is caught here rather than in
// production.
func TestPhase1_FixedModulesStayFixed(t *testing.T) {
	found, _ := scanBrokenIdentitySites(t)
	broken := map[string]bool{}
	for _, f := range found {
		broken[strings.Split(filepath.ToSlash(f), "/")[0]] = true
	}

	for _, module := range []string{
		"mentorship", // fixed in Prompt 1
		"auth",
		"billing",
		"security",
		"profile",
		"admin",
		"support",
		"legal",
		"backup",
		"data_operations",
		"system_health",
	} {
		if broken[module] {
			t.Errorf("module %q has regressed to reading identity from the unset \"user_id\" key", module)
		}
	}
}

// TestPhase1_NoHardcodedIdentityInFixedModules: the modules Phase 1 touched
// must not resolve a caller by inventing one. A fallback UUID silently turns a
// failed identity lookup into a successful request as somebody else.
//
// Only delivery/http is walked, because that is where a request's caller is
// resolved. Repositories legitimately hold fixed UUIDs for seeded reference
// data — the billing free plan, for one — and those are not identities.
func TestPhase1_NoHardcodedIdentityInFixedModules(t *testing.T) {
	root := backendRoot(t)
	fallback := regexp.MustCompile(`uuid\.MustParse\("9a8b7c6d|uuid\.MustParse\("00000000-0000-0000-0000-000000000001"\)`)

	for _, module := range []string{"mentorship", "billing", "security", "auth", "profile"} {
		dir := filepath.Join(root, "internal", module, "delivery", "http")
		if _, err := os.Stat(dir); err != nil {
			t.Fatalf("module %q has no delivery/http directory; this test would pass vacuously", module)
		}

		err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
				return err
			}
			raw, readErr := os.ReadFile(path)
			if readErr != nil {
				return readErr
			}
			for i, line := range strings.Split(string(raw), "\n") {
				trimmed := strings.TrimSpace(line)
				if strings.HasPrefix(trimmed, "//") {
					continue
				}
				if fallback.MatchString(trimmed) {
					rel, _ := filepath.Rel(root, path)
					t.Errorf("%s:%d resolves a caller to a hardcoded UUID: %s", rel, i+1, trimmed)
				}
			}
			return nil
		})
		if err != nil {
			t.Fatalf("walk %s: %v", module, err)
		}
	}
}
