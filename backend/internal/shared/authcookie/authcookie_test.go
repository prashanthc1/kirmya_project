package authcookie

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

// TestDevelopmentCookieIsNotSecure covers the failure that signed users out on
// reload in every browser that does not make a localhost exception.
//
// The API is served over plain HTTP in development, and a Secure cookie on an
// insecure origin is discarded by WebKit without an error anyone sees. Login
// still looks successful — the access token comes back in the response body and
// lives in memory — and the session only disappears when the page reloads and
// there is no cookie to present.
func TestDevelopmentCookieIsNotSecure(t *testing.T) {
	t.Setenv("APP_ENV", "development")

	cfg := FromEnv()

	if cfg.Secure {
		t.Error("the development refresh cookie is Secure; a plain-HTTP origin will not store it")
	}
	if cfg.SameSite != http.SameSiteLaxMode {
		t.Errorf("SameSite = %v, want Lax", cfg.SameSite)
	}
	if cfg.Domain != "" {
		t.Errorf("Domain = %q, want a host-only cookie", cfg.Domain)
	}
}

func TestProductionCookieIsAlwaysSecure(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	// Even asked for explicitly: a production deployment must never hand the
	// refresh token to a plaintext connection.
	t.Setenv("AUTH_COOKIE_SECURE", "false")

	if cfg := FromEnv(); !cfg.Secure {
		t.Error("production accepted AUTH_COOKIE_SECURE=false")
	}
}

// SameSite=None is rejected outright by browsers unless the cookie is also
// Secure, so the combination has to be corrected rather than written out.
func TestSameSiteNoneForcesSecure(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("AUTH_COOKIE_SAME_SITE", "none")

	cfg := FromEnv()

	if cfg.SameSite != http.SameSiteNoneMode {
		t.Errorf("SameSite = %v, want None", cfg.SameSite)
	}
	if !cfg.Secure {
		t.Error("SameSite=None was configured without Secure; the browser would drop the cookie")
	}
}

func TestLifetimeFollowsRememberMe(t *testing.T) {
	t.Setenv("APP_ENV", "test")
	t.Setenv("REFRESH_TOKEN_TTL", "168h")
	t.Setenv("REMEMBER_ME_REFRESH_TOKEN_TTL", "720h")

	cfg := FromEnv()

	if got := cfg.Lifetime(false); got != 168*time.Hour {
		t.Errorf("normal lifetime = %v, want 168h", got)
	}
	if got := cfg.Lifetime(true); got != 720*time.Hour {
		t.Errorf("remember-me lifetime = %v, want 720h", got)
	}
}

// A Remember Me lifetime shorter than the normal one would quietly shorten the
// sessions it exists to extend, so it is corrected rather than obeyed.
func TestRememberMeNeverShortensASession(t *testing.T) {
	t.Setenv("APP_ENV", "test")
	t.Setenv("REFRESH_TOKEN_TTL", "168h")
	t.Setenv("REMEMBER_ME_REFRESH_TOKEN_TTL", "1h")

	cfg := FromEnv()

	if cfg.Lifetime(true) < cfg.Lifetime(false) {
		t.Errorf("remember-me lifetime %v is shorter than the normal %v", cfg.Lifetime(true), cfg.Lifetime(false))
	}
}

func TestUnparseableDurationKeepsTheDefault(t *testing.T) {
	t.Setenv("APP_ENV", "test")
	t.Setenv("ACCESS_TOKEN_TTL", "fifteen minutes")

	if got := FromEnv().AccessTTL; got != DefaultAccessTTL {
		t.Errorf("AccessTTL = %v, want the %v default", got, DefaultAccessTTL)
	}
}

// TestSetAndClearAgreeOnEveryAttribute is the guard on the bug that made logout
// unreliable: a cookie is only replaced or deleted when the name, path and
// domain of the new Set-Cookie match the original exactly.
func TestSetAndClearAgreeOnEveryAttribute(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := Config{
		Name:     "refresh_token",
		Path:     "/api/v1/auth",
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	}

	set := captureCookie(t, func(c *gin.Context) {
		cfg.Set(c, "a-token", time.Now().Add(time.Hour))
	})
	cleared := captureCookie(t, func(c *gin.Context) {
		cfg.Clear(c)
	})

	if set.Name != cleared.Name {
		t.Errorf("name: set %q, cleared %q", set.Name, cleared.Name)
	}
	if set.Path != cleared.Path {
		t.Errorf("path: set %q, cleared %q", set.Path, cleared.Path)
	}
	if set.Domain != cleared.Domain {
		t.Errorf("domain: set %q, cleared %q", set.Domain, cleared.Domain)
	}
	if set.Secure != cleared.Secure {
		t.Errorf("secure: set %v, cleared %v", set.Secure, cleared.Secure)
	}
	if set.SameSite != cleared.SameSite {
		t.Errorf("samesite: set %v, cleared %v", set.SameSite, cleared.SameSite)
	}
	if !set.HttpOnly || !cleared.HttpOnly {
		t.Error("the refresh cookie must be HttpOnly in both directions")
	}
	if cleared.MaxAge >= 0 {
		t.Errorf("cleared MaxAge = %d, want a negative value so the browser drops it", cleared.MaxAge)
	}
	if cleared.Value != "" {
		t.Errorf("cleared value = %q, want empty", cleared.Value)
	}
}

// Set derives Max-Age from the session's own expiry, so a rotated cookie cannot
// outlive the session row behind it.
func TestSetDerivesMaxAgeFromTheSessionExpiry(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := Config{Name: "refresh_token", Path: "/api/v1/auth", SameSite: http.SameSiteLaxMode}

	cookie := captureCookie(t, func(c *gin.Context) {
		cfg.Set(c, "a-token", time.Now().Add(48*time.Hour))
	})

	// Allow a second of slack for the clock between the two calls.
	if cookie.MaxAge < 48*3600-5 || cookie.MaxAge > 48*3600 {
		t.Errorf("MaxAge = %d, want roughly %d", cookie.MaxAge, 48*3600)
	}
}

// An already-expired session must clear the cookie rather than write one with a
// non-positive Max-Age, which browsers treat inconsistently.
func TestSetOnAnExpiredSessionClearsInstead(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := Config{Name: "refresh_token", Path: "/api/v1/auth", SameSite: http.SameSiteLaxMode}

	cookie := captureCookie(t, func(c *gin.Context) {
		cfg.Set(c, "a-token", time.Now().Add(-time.Minute))
	})

	if cookie.Value != "" || cookie.MaxAge >= 0 {
		t.Errorf("expired session wrote a live cookie: value %q, MaxAge %d", cookie.Value, cookie.MaxAge)
	}
}

func captureCookie(t *testing.T, write func(*gin.Context)) *http.Cookie {
	t.Helper()

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)

	write(c)

	cookies := (&http.Response{Header: recorder.Header()}).Cookies()
	if len(cookies) != 1 {
		t.Fatalf("expected exactly one Set-Cookie, got %d", len(cookies))
	}
	return cookies[0]
}
