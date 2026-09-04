package http

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"kirmya/internal/auth/dto"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	"kirmya/internal/auth/repository"
	"kirmya/internal/auth/service"
)

// These exercise the reset endpoints as RegisterRoutes wires them, so the rate
// limiters are part of what is tested. A handler-level test would report the
// flow as healthy with every limiter deleted.

const (
	routeUserEmail = "route.subject@kirmya.test"
	routePassword  = "RouteP@ssw0rd123!"
)

func resetRouter(t *testing.T) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)

	repo := repository.NewAuthRepository(nil)
	svc := service.NewAuthService(repo)
	if _, _, err := svc.Register(t.Context(), &dto.RegisterRequest{
		FirstName:       "Route",
		LastName:        "Subject",
		Email:           routeUserEmail,
		Password:        routePassword,
		ConfirmPassword: routePassword,
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}, "127.0.0.1"); err != nil {
		t.Fatalf("seed user: %v", err)
	}

	engine := gin.New()
	RegisterRoutes(engine.Group("/api/v1"), NewAuthHandler(svc),
		authMiddlewarePkg.NewAuthMiddleware(svc))
	return engine
}

func postJSON(engine *gin.Engine, path string, body any, remoteAddr string) *httptest.ResponseRecorder {
	payload, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	if remoteAddr != "" {
		req.RemoteAddr = remoteAddr + ":50000"
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

// TestForgotPasswordIsEnumerationSafeOverHTTP: the status code and the body
// must be the same for an address with an account and one without. Anything
// that differs turns this endpoint into a membership test on the user table.
func TestForgotPasswordIsEnumerationSafeOverHTTP(t *testing.T) {
	engine := resetRouter(t)

	known := postJSON(engine, "/api/v1/auth/forgot-password",
		gin.H{"email": routeUserEmail}, "198.51.100.10")
	unknown := postJSON(engine, "/api/v1/auth/forgot-password",
		gin.H{"email": "no-such-person@kirmya.test"}, "198.51.100.11")

	if known.Code != http.StatusOK || unknown.Code != http.StatusOK {
		t.Fatalf("status codes differ or are not 200: known=%d unknown=%d", known.Code, unknown.Code)
	}
	if known.Body.String() != unknown.Body.String() {
		t.Errorf("response bodies differ between a real and an unknown address:\n known:   %s\n unknown: %s",
			known.Body.String(), unknown.Body.String())
	}
}

// TestForgotPasswordRejectsMalformedInput: validation before anything else.
func TestForgotPasswordRejectsMalformedInput(t *testing.T) {
	engine := resetRouter(t)

	for i, body := range []any{
		gin.H{},
		gin.H{"email": ""},
		gin.H{"email": "not-an-email"},
		gin.H{"email": 42},
	} {
		// A fresh source address per case so the limiter is not what answers.
		rec := postJSON(engine, "/api/v1/auth/forgot-password", body, "198.51.100.2"+string(rune('0'+i)))
		if rec.Code != http.StatusBadRequest {
			t.Errorf("payload %v returned %d, want 400", body, rec.Code)
		}
	}
}

// TestResetPasswordRejectsBadTokens over HTTP: an invalid or missing token is a
// 400 with no detail about which part was wrong.
func TestResetPasswordRejectsBadTokens(t *testing.T) {
	engine := resetRouter(t)

	for i, body := range []any{
		gin.H{"new_password": "IrrelevantP@ss123!"},
		gin.H{"token": "", "new_password": "IrrelevantP@ss123!"},
		gin.H{"token": strings.Repeat("a", 64), "new_password": "IrrelevantP@ss123!"},
		gin.H{"token": strings.Repeat("a", 64), "new_password": "weak"},
	} {
		rec := postJSON(engine, "/api/v1/auth/reset-password", body, "198.51.100.3"+string(rune('0'+i)))
		if rec.Code != http.StatusBadRequest {
			t.Errorf("payload %v returned %d, want 400", body, rec.Code)
		}
	}
}

// TestForgotPasswordIsRateLimited is the abuse criterion at the transport
// layer: one source cannot hammer the endpoint. The per-account throttle in the
// service covers the case this cannot — many sources, one mailbox.
func TestForgotPasswordIsRateLimited(t *testing.T) {
	engine := resetRouter(t)

	const attempts = 12
	limited := 0
	for i := 0; i < attempts; i++ {
		rec := postJSON(engine, "/api/v1/auth/forgot-password",
			gin.H{"email": routeUserEmail}, "203.0.113.77")
		if rec.Code == http.StatusTooManyRequests {
			limited++
			if rec.Header().Get("Retry-After") == "" {
				t.Error("a 429 was returned without a Retry-After header")
			}
		}
	}

	if limited == 0 {
		t.Fatalf("%d rapid reset requests from one address were all accepted; "+
			"the endpoint is not rate limited", attempts)
	}
}

// TestRateLimitIsPerSource is the other half: the limiter must not be a single
// global bucket, or one abusive client denies the endpoint to everybody.
func TestRateLimitIsPerSource(t *testing.T) {
	engine := resetRouter(t)

	for i := 0; i < 12; i++ {
		postJSON(engine, "/api/v1/auth/forgot-password", gin.H{"email": routeUserEmail}, "203.0.113.88")
	}

	rec := postJSON(engine, "/api/v1/auth/forgot-password",
		gin.H{"email": routeUserEmail}, "203.0.113.99")
	if rec.Code == http.StatusTooManyRequests {
		t.Error("a different source address was rate limited by another client's traffic")
	}
}

// TestResetEndpointsAreUnauthenticated: someone who has forgotten their
// password cannot present a token, so these two routes must stay reachable
// without one. This is the guard against a future sweep locking them down.
func TestResetEndpointsAreUnauthenticated(t *testing.T) {
	engine := resetRouter(t)

	for i, path := range []string{"/api/v1/auth/forgot-password", "/api/v1/auth/reset-password"} {
		rec := postJSON(engine, path, gin.H{"email": routeUserEmail, "token": "x", "new_password": routePassword},
			"198.51.100.4"+string(rune('0'+i)))
		if rec.Code == http.StatusUnauthorized || rec.Code == http.StatusForbidden {
			t.Errorf("%s returned %d without a token; it must be reachable by a "+
				"user who cannot sign in", path, rec.Code)
		}
	}
}
