package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func hasRoute(engine *gin.Engine, method, path string) bool {
	for _, r := range engine.Routes() {
		if r.Method == method && r.Path == path {
			return true
		}
	}
	return false
}

// TestSwaggerDisabledByDefault is the security guarantee behind SWAGGER_ENABLED:
// a deployment that never opts in must not expose the API contract at all, not
// merely hide it behind a 404 handler.
func TestSwaggerDisabledByDefault(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := New(Handlers{}, SwaggerConfig{})

	if hasRoute(engine, http.MethodGet, "/swagger/*any") {
		t.Error("swagger route registered even though SwaggerConfig.Enabled is false")
	}
	if hasRoute(engine, http.MethodGet, "/docs") {
		t.Error("/docs redirect registered even though SwaggerConfig.Enabled is false")
	}

	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/swagger/index.html", nil))
	if rec.Code != http.StatusNotFound {
		t.Errorf("GET /swagger/index.html = %d, want 404 when docs are disabled", rec.Code)
	}
}

func TestSwaggerEnabledServesUI(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := New(Handlers{}, SwaggerConfig{Enabled: true, Host: "api.kirmya.com", BasePath: "/"})

	if !hasRoute(engine, http.MethodGet, "/swagger/*any") {
		t.Fatal("swagger route not registered when enabled")
	}

	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/swagger/index.html", nil))
	if rec.Code != http.StatusOK {
		t.Errorf("GET /swagger/index.html = %d, want 200", rec.Code)
	}

	rec = httptest.NewRecorder()
	engine.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/docs", nil))
	if rec.Code != http.StatusFound {
		t.Errorf("GET /docs = %d, want 302 redirect", rec.Code)
	}
	if loc := rec.Header().Get("Location"); loc != "/swagger/index.html" {
		t.Errorf("GET /docs redirected to %q, want /swagger/index.html", loc)
	}
}

// TestSwaggerHostOverride confirms the deployment's own host reaches the served
// spec, so "Try it out" targets the right origin in each environment.
func TestSwaggerHostOverride(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := New(Handlers{}, SwaggerConfig{Enabled: true, Host: "api.kirmya.com", BasePath: "/"})

	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/swagger/doc.json", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /swagger/doc.json = %d, want 200", rec.Code)
	}
	if body := rec.Body.String(); !strings.Contains(body, `"host": "api.kirmya.com"`) {
		t.Error("served spec does not carry the configured host")
	}
}

func TestSwaggerBasicAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := New(Handlers{}, SwaggerConfig{
		Enabled:  true,
		Host:     "api.kirmya.com",
		BasePath: "/",
		Username: "docs",
		Password: "s3cret",
	})

	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/swagger/index.html", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("unauthenticated GET /swagger/index.html = %d, want 401", rec.Code)
	}

	req := httptest.NewRequest(http.MethodGet, "/swagger/index.html", nil)
	req.SetBasicAuth("docs", "s3cret")
	rec = httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("authenticated GET /swagger/index.html = %d, want 200", rec.Code)
	}
}
