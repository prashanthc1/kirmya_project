package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// The CSRF question these answer: CORS decides whether the attacker's page may
// read our response, but the request has already run by then. OriginGuard is
// what stops the write itself.

func guardRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(OriginGuard([]string{"https://kirmya.com"}))
	r.POST("/api/v1/auth/logout", func(c *gin.Context) { c.Status(http.StatusOK) })
	r.GET("/api/v1/jobs", func(c *gin.Context) { c.Status(http.StatusOK) })
	return r
}

func requestWith(t *testing.T, method, path string, headers map[string]string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, nil)
	req.Host = "api.kirmya.com"
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	res := httptest.NewRecorder()
	guardRouter().ServeHTTP(res, req)
	return res
}

func TestConfiguredOriginMayWrite(t *testing.T) {
	res := requestWith(t, http.MethodPost, "/api/v1/auth/logout",
		map[string]string{"Origin": "https://kirmya.com"})

	if res.Code != http.StatusOK {
		t.Errorf("status = %d, want 200 for the configured web origin", res.Code)
	}
}

// The forged cross-site write. Under CORS alone this reached the handler and
// took effect; only the response was hidden from the attacker.
func TestForeignOriginCannotWrite(t *testing.T) {
	res := requestWith(t, http.MethodPost, "/api/v1/auth/logout",
		map[string]string{"Origin": "https://attacker.example"})

	if res.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403 — the write went through", res.Code)
	}
}

// A sandboxed iframe or a file:// page sends Origin: null. It must not be
// treated as "no origin" and waved through.
func TestNullOriginCannotWrite(t *testing.T) {
	res := requestWith(t, http.MethodPost, "/api/v1/auth/logout",
		map[string]string{"Origin": "null"})

	if res.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403 for Origin: null", res.Code)
	}
}

// Referer is the fallback for the browser paths that omit Origin.
func TestForeignRefererCannotWrite(t *testing.T) {
	res := requestWith(t, http.MethodPost, "/api/v1/auth/logout",
		map[string]string{"Referer": "https://attacker.example/some/page"})

	if res.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403 for a foreign Referer", res.Code)
	}
}

// Non-browser callers — the mobile app, a server-to-server integration, curl —
// send neither header and carry no ambient cookie to forge with.
func TestRequestWithoutOriginPasses(t *testing.T) {
	res := requestWith(t, http.MethodPost, "/api/v1/auth/logout", nil)

	if res.Code != http.StatusOK {
		t.Errorf("status = %d, want 200 for a non-browser caller", res.Code)
	}
}

// Safe methods are never blocked; a public GET must work from anywhere.
func TestSafeMethodsAreNotGuarded(t *testing.T) {
	res := requestWith(t, http.MethodGet, "/api/v1/jobs",
		map[string]string{"Origin": "https://attacker.example"})

	if res.Code != http.StatusOK {
		t.Errorf("status = %d, want 200 — the guard must not touch safe methods", res.Code)
	}
}

// A deployment that forgot to list its own address must not lock itself out of
// its own API.
func TestSameOriginIsAllowedWithoutConfiguration(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)
	req.Host = "api.kirmya.com"
	req.Header.Set("Origin", "https://api.kirmya.com")
	req.Header.Set("X-Forwarded-Proto", "https")

	res := httptest.NewRecorder()
	guardRouter().ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Errorf("status = %d, want 200 for a same-origin request", res.Code)
	}
}

// Origin wins over Referer: an attacker cannot pass by sending a trusted
// Referer alongside their own Origin.
func TestOriginBeatsReferer(t *testing.T) {
	res := requestWith(t, http.MethodPost, "/api/v1/auth/logout", map[string]string{
		"Origin":  "https://attacker.example",
		"Referer": "https://kirmya.com/dashboard",
	})

	if res.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403 — a trusted Referer overrode a foreign Origin", res.Code)
	}
}

// Trailing slashes and case differences are the same origin.
func TestOriginComparisonIsNormalized(t *testing.T) {
	res := requestWith(t, http.MethodPost, "/api/v1/auth/logout",
		map[string]string{"Origin": "https://KIRMYA.com/"})

	if res.Code != http.StatusOK {
		t.Errorf("status = %d, want 200 — normalisation rejected an equivalent origin", res.Code)
	}
}
