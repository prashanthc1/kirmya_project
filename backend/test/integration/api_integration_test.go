package integration

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	authHttp "kirmya/internal/auth/delivery/http"
	"kirmya/internal/auth/repository"
	"kirmya/internal/auth/service"
	"kirmya/internal/shared/middleware"
	"kirmya/internal/shared/telemetry"

	"github.com/gin-gonic/gin"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.TelemetryMiddleware())

	authRepo := repository.NewAuthRepository(nil)
	authSvc := service.NewAuthService(authRepo)
	authHandler := authHttp.NewAuthHandler(authSvc)

	api := r.Group("/api/v1")
	{
		api.GET("/metrics", func(c *gin.Context) {
			collector := telemetry.GetGlobalCollector()
			c.String(http.StatusOK, collector.GetPrometheusMetrics())
		})

		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
		}
	}
	return r
}

func TestAuthRegisterAndLoginAPIIntegration(t *testing.T) {
	router := setupTestRouter()

	// 1. Test Register Payload
	regPayload := `{"email":"newuser.api@kirmya.com","password":"Password123!","full_name":"API Tester"}`
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", strings.NewReader(regPayload))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected HTTP 201 Created on register, got status %d", w.Code)
	}

	var regResp map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &regResp)
	if regResp["email"] != "newuser.api@kirmya.com" {
		t.Errorf("Expected user email newuser.api@kirmya.com in register response, got %v", regResp["email"])
	}

	// 2. Test Login Payload with registered credentials
	loginPayload := `{"email":"newuser.api@kirmya.com","password":"Password123!"}`
	reqLogin, _ := http.NewRequest("POST", "/api/v1/auth/login", strings.NewReader(loginPayload))
	reqLogin.Header.Set("Content-Type", "application/json")

	wLogin := httptest.NewRecorder()
	router.ServeHTTP(wLogin, reqLogin)

	if wLogin.Code != http.StatusOK {
		t.Fatalf("Expected HTTP 200 OK on login, got status %d: %s", wLogin.Code, wLogin.Body.String())
	}

	var loginResp map[string]interface{}
	_ = json.Unmarshal(wLogin.Body.Bytes(), &loginResp)
	if loginResp["accessToken"] == nil {
		t.Errorf("Expected accessToken in login response body")
	}

	// 3. Test Prometheus Metrics Endpoint
	reqMetrics, _ := http.NewRequest("GET", "/api/v1/metrics", nil)
	wMetrics := httptest.NewRecorder()
	router.ServeHTTP(wMetrics, reqMetrics)

	if wMetrics.Code != http.StatusOK {
		t.Fatalf("Expected HTTP 200 OK on metrics endpoint, got %d", wMetrics.Code)
	}
	if !strings.Contains(wMetrics.Body.String(), "http_requests_total") {
		t.Errorf("Expected metrics response to contain http_requests_total metric gauge")
	}
}
