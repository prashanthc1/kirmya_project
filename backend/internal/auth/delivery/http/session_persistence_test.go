package http

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"kirmya/internal/auth/dto"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	"kirmya/internal/auth/repository"
	"kirmya/internal/auth/service"

	"github.com/gin-gonic/gin"
)

// These tests cover the acceptance criterion directly: a signed-in browser must
// still be signed in after a reload, with no token in localStorage. The browser
// only carries the refresh cookie across a reload, so everything here is about
// that cookie existing, being storable, and still working the second time.

const (
	testEmail    = "session@kirmya.test"
	testPassword = "SecureP@ssw0rd123!"
)

type harness struct {
	router *gin.Engine
	svc    *service.AuthService
}

func newHarness(t *testing.T) *harness {
	t.Helper()
	gin.SetMode(gin.TestMode)

	repo := repository.NewAuthRepository(nil)
	svc := service.NewAuthService(repo)
	handler := NewAuthHandler(svc)

	if _, _, err := svc.Register(t.Context(), &dto.RegisterRequest{
		FirstName:       "Session",
		LastName:        "Subject",
		Email:           testEmail,
		Password:        testPassword,
		ConfirmPassword: testPassword,
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}, "127.0.0.1"); err != nil {
		t.Fatalf("seed user: %v", err)
	}

	router := gin.New()
	api := router.Group("/api/v1")
	// The real registration, so the rate-limit layout under test is the one the
	// application mounts rather than a bare handler.
	RegisterRoutesWithSessionLimit(api, handler, authMiddlewarePkg.NewAuthMiddleware(svc), 0, 0, 0, 0)

	return &harness{router: router, svc: svc}
}

func (h *harness) do(t *testing.T, method, path string, body any, cookies ...*http.Cookie) *httptest.ResponseRecorder {
	t.Helper()

	var reader *bytes.Buffer
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("encode body: %v", err)
		}
		reader = bytes.NewBuffer(encoded)
	} else {
		reader = bytes.NewBuffer(nil)
	}

	req := httptest.NewRequest(method, path, reader)
	req.Header.Set("Content-Type", "application/json")
	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}

	recorder := httptest.NewRecorder()
	h.router.ServeHTTP(recorder, req)
	return recorder
}

// login signs in and returns the refresh cookie the browser would keep.
func (h *harness) login(t *testing.T, rememberMe bool) *http.Cookie {
	t.Helper()

	res := h.do(t, http.MethodPost, "/api/v1/auth/login", dto.LoginRequest{
		Email: testEmail, Password: testPassword, RememberMe: rememberMe,
	})
	if res.Code != http.StatusOK {
		t.Fatalf("login: status %d, body %s", res.Code, res.Body.String())
	}

	cookie := refreshCookie(t, res)
	if cookie == nil {
		t.Fatal("login set no refresh cookie; nothing would survive a reload")
	}
	return cookie
}

func refreshCookie(t *testing.T, res *httptest.ResponseRecorder) *http.Cookie {
	t.Helper()
	for _, cookie := range (&http.Response{Header: res.Header()}).Cookies() {
		if cookie.Name == "refresh_token" {
			return cookie
		}
	}
	return nil
}

// TestLoginSetsAStorableRefreshCookie is the guard on the failure mode where
// signing in appears to work and the reload does not.
//
// The access token comes back in the body and lives in memory, so a login whose
// cookie the browser silently refused still looks successful — until the page
// reloads with nothing to present. The attributes are asserted individually
// because each one can cause that on its own.
func TestLoginSetsAStorableRefreshCookie(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	h := newHarness(t)

	cookie := h.login(t, false)

	if !cookie.HttpOnly {
		t.Error("the refresh cookie is not HttpOnly; script can read the refresh token")
	}
	if cookie.Secure {
		t.Error("the development cookie is Secure over plain HTTP; WebKit will discard it")
	}
	if cookie.SameSite == http.SameSiteStrictMode {
		t.Error("SameSite=Strict breaks the cookie the moment the web client is served from another host")
	}
	if cookie.Path != "/api/v1/auth" {
		t.Errorf("Path = %q, want /api/v1/auth", cookie.Path)
	}
	if cookie.Domain != "" {
		t.Errorf("Domain = %q, want a host-only cookie", cookie.Domain)
	}
	if cookie.Value == "" {
		t.Error("the refresh cookie carries no value")
	}
	if cookie.MaxAge <= 0 {
		t.Errorf("MaxAge = %d; a session cookie is lost when the browser closes", cookie.MaxAge)
	}
}

// TestReloadRestoresTheSession is the acceptance criterion.
func TestReloadRestoresTheSession(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	h := newHarness(t)

	cookie := h.login(t, false)

	// The reload: memory is gone, only the cookie remains.
	res := h.do(t, http.MethodPost, "/api/v1/auth/refresh", nil, cookie)
	if res.Code != http.StatusOK {
		t.Fatalf("refresh after reload: status %d, body %s", res.Code, res.Body.String())
	}

	var body struct {
		AccessToken string `json:"accessToken"`
		ExpiresIn   int    `json:"expiresIn"`
	}
	if err := json.Unmarshal(res.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode refresh response: %v", err)
	}
	if body.AccessToken == "" {
		t.Fatal("refresh returned no access token")
	}
	if body.ExpiresIn <= 0 {
		t.Errorf("expiresIn = %d, want the real token lifetime", body.ExpiresIn)
	}

	// And the token works against an authenticated route.
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+body.AccessToken)
	me := httptest.NewRecorder()
	h.router.ServeHTTP(me, req)
	if me.Code != http.StatusOK {
		t.Fatalf("/auth/me after reload: status %d, body %s", me.Code, me.Body.String())
	}
}

// TestRefreshRotatesTheCookieAndRejectsTheOldOne covers rotation and replay in
// one pass: the reload must be handed a new token, and the spent one must stop
// working.
func TestRefreshRotatesTheCookieAndRejectsTheOldOne(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	h := newHarness(t)

	original := h.login(t, false)

	res := h.do(t, http.MethodPost, "/api/v1/auth/refresh", nil, original)
	if res.Code != http.StatusOK {
		t.Fatalf("refresh: status %d", res.Code)
	}

	rotated := refreshCookie(t, res)
	if rotated == nil {
		t.Fatal("refresh set no replacement cookie")
	}
	if rotated.Value == original.Value {
		t.Error("refresh returned the same token; it is not rotating")
	}

	// The rotated cookie works.
	if again := h.do(t, http.MethodPost, "/api/v1/auth/refresh", nil, rotated); again.Code != http.StatusOK {
		t.Fatalf("the rotated cookie was refused: status %d, body %s", again.Code, again.Body.String())
	}

	// The spent one, presented later, does not. It is beyond the concurrency
	// grace window only in the sense that it is a genuine replay: whichever way
	// the server classifies it, it must not mint a session.
	replay := h.do(t, http.MethodPost, "/api/v1/auth/refresh", nil, original)
	if replay.Code == http.StatusOK {
		t.Error("a spent refresh token was accepted a second time")
	}
}

// TestRememberMeCookieOutlivesANormalOne checks the policy reaches the browser,
// not just the session row.
func TestRememberMeCookieOutlivesANormalOne(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	h := newHarness(t)

	normal := h.login(t, false)
	remembered := h.login(t, true)

	if remembered.MaxAge <= normal.MaxAge {
		t.Errorf("Remember Me cookie MaxAge %d is not longer than the normal %d",
			remembered.MaxAge, normal.MaxAge)
	}

	// And rotation must not shorten it. This is the defect: the refresh handler
	// wrote a flat seven days, so the first reload cut a thirty-day session down.
	res := h.do(t, http.MethodPost, "/api/v1/auth/refresh", nil, remembered)
	if res.Code != http.StatusOK {
		t.Fatalf("refresh: status %d, body %s", res.Code, res.Body.String())
	}
	rotated := refreshCookie(t, res)
	if rotated == nil {
		t.Fatal("refresh set no cookie")
	}
	if rotated.MaxAge <= normal.MaxAge {
		t.Errorf("after rotation the Remember Me cookie lasts %d, no longer than a normal %d",
			rotated.MaxAge, normal.MaxAge)
	}
}

// TestLogoutClearsTheCookieAndKillsTheSession covers the acceptance criterion
// "logout, then reload, still logged out".
func TestLogoutClearsTheCookieAndKillsTheSession(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	h := newHarness(t)

	cookie := h.login(t, false)

	res := h.do(t, http.MethodPost, "/api/v1/auth/logout", nil, cookie)
	if res.Code != http.StatusOK {
		t.Fatalf("logout: status %d, body %s", res.Code, res.Body.String())
	}

	cleared := refreshCookie(t, res)
	if cleared == nil {
		t.Fatal("logout set no clearing cookie, so the browser keeps the old one")
	}
	if cleared.MaxAge >= 0 || cleared.Value != "" {
		t.Errorf("logout did not expire the cookie: value %q, MaxAge %d", cleared.Value, cleared.MaxAge)
	}
	// The clearing cookie has to match the one that was set, or the browser
	// stores a second cookie and keeps the first.
	if cleared.Path != cookie.Path || cleared.Domain != cookie.Domain {
		t.Errorf("clearing cookie path/domain (%q/%q) does not match the original (%q/%q)",
			cleared.Path, cleared.Domain, cookie.Path, cookie.Domain)
	}

	// A reload afterwards must not resurrect the session.
	reload := h.do(t, http.MethodPost, "/api/v1/auth/refresh", nil, cookie)
	if reload.Code == http.StatusOK {
		t.Error("the session was restored after logout")
	}
}

// TestReloadingRepeatedlyIsNotRateLimited is the regression test for the defect
// that actually signed people out.
//
// /auth/refresh and /auth/me shared the credential endpoints' five-per-minute
// per-IP bucket. Restoring a session costs one of each, so the third reload from
// an address answered 429 — and the web client, which cannot tell a throttle
// from a dead session, cleared the user. Behind one office NAT it was the third
// reload across all users on it.
func TestReloadingRepeatedlyIsNotRateLimited(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	h := newHarness(t)

	cookie := h.login(t, false)

	for i := 0; i < 12; i++ {
		res := h.do(t, http.MethodPost, "/api/v1/auth/refresh", nil, cookie)
		if res.Code == http.StatusTooManyRequests {
			t.Fatalf("reload %d was rate limited; a user who refreshes the page is signed out", i+1)
		}
		if res.Code != http.StatusOK {
			t.Fatalf("reload %d: status %d, body %s", i+1, res.Code, res.Body.String())
		}
		rotated := refreshCookie(t, res)
		if rotated == nil {
			t.Fatalf("reload %d set no cookie", i+1)
		}
		cookie = rotated
	}
}

// The credential endpoints keep their tight bucket. Loosening the session
// endpoints must not have loosened login along with them.
func TestLoginKeepsItsTightRateLimit(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	h := newHarness(t)

	throttled := false
	for i := 0; i < 12; i++ {
		res := h.do(t, http.MethodPost, "/api/v1/auth/login", dto.LoginRequest{
			Email: testEmail, Password: "WrongPassword123!",
		})
		if res.Code == http.StatusTooManyRequests {
			throttled = true
			break
		}
	}

	if !throttled {
		t.Error("twelve failed sign-ins from one address were all accepted; the credential limiter is gone")
	}
}

// A missing cookie is an unauthenticated caller, not a server error — this is
// the path every anonymous visitor takes on their first page load.
func TestRefreshWithoutACookieIsUnauthorized(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	h := newHarness(t)

	if res := h.do(t, http.MethodPost, "/api/v1/auth/refresh", nil); res.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", res.Code)
	}
}

// A refresh presented with a token that matches nothing must clear the cookie,
// so a browser holding a dead token stops sending it on every page load.
func TestRefreshWithAnUnknownTokenClearsTheCookie(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	h := newHarness(t)

	res := h.do(t, http.MethodPost, "/api/v1/auth/refresh", nil,
		&http.Cookie{Name: "refresh_token", Value: "0123456789abcdef", Path: "/api/v1/auth"})

	if res.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.Code)
	}
	cleared := refreshCookie(t, res)
	if cleared == nil || cleared.MaxAge >= 0 {
		t.Error("a rejected refresh left the dead cookie in place")
	}
}

// The login response must report the lifetime of the token it just issued.
// It was hardcoded to 86400 against a token that expires in minutes.
func TestLoginReportsTheRealAccessTokenLifetime(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	h := newHarness(t)

	res := h.do(t, http.MethodPost, "/api/v1/auth/login", dto.LoginRequest{
		Email: testEmail, Password: testPassword,
	})
	if res.Code != http.StatusOK {
		t.Fatalf("login: status %d", res.Code)
	}

	var body struct {
		ExpiresIn int64 `json:"expires_in"`
	}
	if err := json.Unmarshal(res.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode: %v", err)
	}

	want := int64(h.svc.AccessTokenTTL() / time.Second)
	if body.ExpiresIn != want {
		t.Errorf("expires_in = %d, want %d — the value the token actually carries", body.ExpiresIn, want)
	}
}
