package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	configPkg "kirmya/internal/shared/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// signedTokenWithRole mints a token the way the auth service does, so these
// tests exercise real signature verification rather than a pre-populated
// context. A test that only calls c.Set("role", …) proves the role comparison
// works but proves nothing about whether an attacker can get a role in there.
func signedTokenWithRole(t *testing.T, role string) string {
	t.Helper()
	claims := JWTClaims{
		UserID: uuid.New(),
		Email:  "user@example.com",
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "kirmya-auth-service",
		},
	}
	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString(configPkg.GetJWTSecretBytes())
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return signed
}

// runGuard drives a middleware through a real gin engine so aborts, status
// codes and handler reachability are all observed the way production sees them.
func runGuard(t *testing.T, guard gin.HandlerFunc, bearer string) (*httptest.ResponseRecorder, bool) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	reached := false
	r := gin.New()
	r.GET("/guarded", guard, func(c *gin.Context) {
		reached = true
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/guarded", nil)
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec, reached
}

func TestRequireAdmin_StatusCodes(t *testing.T) {
	cases := []struct {
		name       string
		role       string // "" means send no token at all
		sendToken  bool
		wantStatus int
		wantReach  bool
	}{
		{"no token is unauthenticated, not forbidden", "", false, http.StatusUnauthorized, false},
		{"ordinary user is forbidden", RoleUser, true, http.StatusForbidden, false},
		{"recruiter is forbidden", RoleRecruiter, true, http.StatusForbidden, false},
		{"hiring manager is forbidden", RoleHiringManager, true, http.StatusForbidden, false},
		{"moderator is forbidden", RoleModerator, true, http.StatusForbidden, false},
		{"admin passes", RoleAdmin, true, http.StatusOK, true},
		{"super_admin passes", RoleSuperAdmin, true, http.StatusOK, true},
		{"platform_admin passes", RolePlatformAdmin, true, http.StatusOK, true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var bearer string
			if tc.sendToken {
				bearer = signedTokenWithRole(t, tc.role)
			}
			rec, reached := runGuard(t, RequireAdmin(), bearer)

			if rec.Code != tc.wantStatus {
				t.Errorf("status = %d, want %d; body = %s", rec.Code, tc.wantStatus, rec.Body.String())
			}
			if reached != tc.wantReach {
				t.Errorf("handler reached = %v, want %v", reached, tc.wantReach)
			}
		})
	}
}

// TestRequireAdmin_StandaloneAuthenticates is the property that makes this
// middleware safe to hand to a route group: it does not depend on the caller
// remembering to pair it with AuthRequired.
func TestRequireAdmin_StandaloneAuthenticates(t *testing.T) {
	rec, reached := runGuard(t, RequireAdmin(), signedTokenWithRole(t, RoleAdmin))
	if rec.Code != http.StatusOK || !reached {
		t.Fatalf("RequireAdmin alone rejected a valid admin: status=%d reached=%v body=%s",
			rec.Code, reached, rec.Body.String())
	}
}

// TestRequireAdmin_StackedAfterAuthRequired covers the other deployment shape:
// the 13 existing admin groups apply AuthRequired first. Authentication must be
// idempotent so stacking does not double-reject or lose the identity.
func TestRequireAdmin_StackedAfterAuthRequired(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var sawUser bool

	r := gin.New()
	r.GET("/guarded", AuthRequired(), RequireAdmin(), func(c *gin.Context) {
		_, sawUser = GetUserID(c)
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/guarded", nil)
	req.Header.Set("Authorization", "Bearer "+signedTokenWithRole(t, RoleSuperAdmin))
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body = %s", rec.Code, rec.Body.String())
	}
	if !sawUser {
		t.Error("identity was lost when RequireAdmin ran after AuthRequired")
	}
}

// TestRequireRole_RejectsForgedAndTamperedTokens covers the attacks that matter
// more than a wrong role: a token the server never signed, and one signed with
// the "none" algorithm.
func TestRequireRole_RejectsForgedAndTamperedTokens(t *testing.T) {
	adminClaims := JWTClaims{
		UserID: uuid.New(),
		Role:   RoleAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
		},
	}

	forged, err := jwt.NewWithClaims(jwt.SigningMethodHS256, adminClaims).
		SignedString([]byte("an-attacker-chosen-signing-key-32b"))
	if err != nil {
		t.Fatalf("sign forged token: %v", err)
	}

	unsigned, err := jwt.NewWithClaims(jwt.SigningMethodNone, adminClaims).
		SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("sign alg-none token: %v", err)
	}

	for name, token := range map[string]string{
		"token signed with the wrong key": forged,
		"token using alg=none":            unsigned,
		"structurally invalid token":      "not-a-jwt",
	} {
		t.Run(name, func(t *testing.T) {
			rec, reached := runGuard(t, RequireAdmin(), token)
			if rec.Code != http.StatusUnauthorized {
				t.Errorf("status = %d, want 401", rec.Code)
			}
			if reached {
				t.Error("forged credential reached the handler")
			}
		})
	}
}

func TestRequireRole_ExpiredTokenIsRejected(t *testing.T) {
	claims := JWTClaims{
		UserID: uuid.New(),
		Role:   RoleAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-time.Hour)),
		},
	}
	expired, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString(configPkg.GetJWTSecretBytes())
	if err != nil {
		t.Fatalf("sign expired token: %v", err)
	}

	rec, reached := runGuard(t, RequireAdmin(), expired)
	if rec.Code != http.StatusUnauthorized || reached {
		t.Fatalf("expired token accepted: status=%d reached=%v", rec.Code, reached)
	}
}

// TestRequireRole_IsCaseAndWhitespaceInsensitive guards against a role stored
// as "Admin" or " admin" in the database silently failing the check.
func TestRequireRole_IsCaseAndWhitespaceInsensitive(t *testing.T) {
	for _, role := range []string{"ADMIN", "Admin", " admin "} {
		t.Run(role, func(t *testing.T) {
			rec, reached := runGuard(t, RequireAdmin(), signedTokenWithRole(t, role))
			if rec.Code != http.StatusOK || !reached {
				t.Errorf("role %q rejected: status=%d", role, rec.Code)
			}
		})
	}
}

// TestRequireRole_NoRolesFailsClosed: a misconfigured guard must deny, not admit.
func TestRequireRole_NoRolesFailsClosed(t *testing.T) {
	for name, guard := range map[string]gin.HandlerFunc{
		"no roles":    RequireRole(),
		"empty role":  RequireRole(""),
		"only blanks": RequireRole("", "   "),
	} {
		t.Run(name, func(t *testing.T) {
			rec, reached := runGuard(t, guard, signedTokenWithRole(t, RoleAdmin))
			if rec.Code != http.StatusForbidden || reached {
				t.Errorf("misconfigured guard admitted a caller: status=%d reached=%v", rec.Code, reached)
			}
		})
	}
}

// TestRequireRole_DoesNotLeakRequiredRoles: the denial must not tell an attacker
// which role to go and acquire.
func TestRequireRole_DoesNotLeakRequiredRoles(t *testing.T) {
	rec, _ := runGuard(t, RequireAdmin(), signedTokenWithRole(t, RoleUser))
	for _, leaked := range AdminRoles() {
		if body := rec.Body.String(); containsFold(body, leaked) {
			t.Errorf("403 body leaks the required role %q: %s", leaked, body)
		}
	}
}

// TestAdminRoles_IsTheCanonicalSet pins the admin role set so widening it is a
// deliberate edit to this test rather than an accident in a route file.
func TestAdminRoles_IsTheCanonicalSet(t *testing.T) {
	want := map[string]bool{RoleAdmin: true, RoleSuperAdmin: true, RolePlatformAdmin: true}
	got := AdminRoles()
	if len(got) != len(want) {
		t.Fatalf("AdminRoles() = %v, want exactly %d roles", got, len(want))
	}
	for _, r := range got {
		if !want[r] {
			t.Errorf("unexpected role %q in the admin set", r)
		}
	}
}

// TestAuthRequired_StillEstablishesIdentityOnly confirms the refactor did not
// change AuthRequired: it must keep admitting non-admin users, which is what
// every ordinary user route depends on.
func TestAuthRequired_StillEstablishesIdentityOnly(t *testing.T) {
	rec, reached := runGuard(t, AuthRequired(), signedTokenWithRole(t, RoleUser))
	if rec.Code != http.StatusOK || !reached {
		t.Fatalf("AuthRequired rejected an ordinary user: status=%d reached=%v; "+
			"non-admin flows would be broken", rec.Code, reached)
	}

	rec, reached = runGuard(t, AuthRequired(), "")
	if rec.Code != http.StatusUnauthorized || reached {
		t.Fatalf("AuthRequired admitted an anonymous caller: status=%d reached=%v", rec.Code, reached)
	}
}

func containsFold(haystack, needle string) bool {
	return len(needle) > 0 && len(haystack) >= len(needle) &&
		stringsContainsFold(haystack, needle)
}

func stringsContainsFold(s, substr string) bool {
	for i := 0; i+len(substr) <= len(s); i++ {
		if equalFoldASCII(s[i:i+len(substr)], substr) {
			return true
		}
	}
	return false
}

func equalFoldASCII(a, b string) bool {
	for i := 0; i < len(a); i++ {
		ca, cb := a[i], b[i]
		if 'A' <= ca && ca <= 'Z' {
			ca += 'a' - 'A'
		}
		if 'A' <= cb && cb <= 'Z' {
			cb += 'a' - 'A'
		}
		if ca != cb {
			return false
		}
	}
	return true
}
