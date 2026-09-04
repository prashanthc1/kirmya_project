package http

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"kirmya/internal/billing/repository"
	"kirmya/internal/billing/service"
)

// These tests exercise the billing routes as they are actually registered,
// rather than calling handlers directly, so the middleware chain is part of
// what is under test. A handler-level test would pass even with every guard
// removed from routes.go.

const webhookSecret = "whsec_route_test_secret"

func billingEngine(t *testing.T) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	api := engine.Group("/api/v1")
	RegisterBillingRoutes(api, NewBillingHandler(service.NewBillingService(repository.NewBillingRepository(nil))))
	return engine
}

func do(engine *gin.Engine, method, path string, body []byte, headers map[string]string) *httptest.ResponseRecorder {
	var req *http.Request
	if body == nil {
		req = httptest.NewRequest(method, path, nil)
	} else {
		req = httptest.NewRequest(method, path, bytes.NewReader(body))
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

// TestBillingUserRoutesRejectAnonymousCallers pins the authentication guard on
// every route that is not deliberately public. Subscription state and checkout
// are per-account, so an unauthenticated caller must get 401 and never reach a
// handler.
func TestBillingUserRoutesRejectAnonymousCallers(t *testing.T) {
	engine := billingEngine(t)

	for _, rt := range []struct {
		method, path string
	}{
		{http.MethodGet, "/api/v1/billing/status"},
		{http.MethodGet, "/api/v1/billing/subscription"},
		{http.MethodPost, "/api/v1/billing/checkout"},
	} {
		rec := do(engine, rt.method, rt.path, []byte(`{}`), map[string]string{"Content-Type": "application/json"})
		if rec.Code != http.StatusUnauthorized {
			t.Errorf("%s %s returned %d without a token, want 401", rt.method, rt.path, rec.Code)
		}
	}
}

// TestBillingUserRoutesRejectMalformedTokens: a token that is present but not
// verifiable is not authentication. This is the case a guard that only checks
// for the presence of a header would let through.
func TestBillingUserRoutesRejectMalformedTokens(t *testing.T) {
	engine := billingEngine(t)

	for _, bearer := range []string{
		"Bearer not-a-jwt",
		"Bearer " + strings.Repeat("a.", 2) + "a",
		"Basic dXNlcjpwYXNz",
	} {
		rec := do(engine, http.MethodGet, "/api/v1/billing/subscription", nil,
			map[string]string{"Authorization": bearer})
		if rec.Code != http.StatusUnauthorized {
			t.Errorf("Authorization %q returned %d, want 401", bearer, rec.Code)
		}
	}
}

// TestBillingPlansStayPublic is the counterpart guard: the public price list
// must not have acquired authentication. Requiring a login to read prices would
// be a regression, not a hardening.
func TestBillingPlansStayPublic(t *testing.T) {
	engine := billingEngine(t)

	if rec := do(engine, http.MethodGet, "/api/v1/billing/plans", nil, nil); rec.Code != http.StatusOK {
		t.Errorf("GET /api/v1/billing/plans returned %d anonymously, want 200", rec.Code)
	}
}

func signBody(secret string, body []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}

// TestWebhookRouteRejectsUnverifiedCallers is the important one. The route is
// necessarily unauthenticated — a payment provider has no user token — so the
// signature is the only thing distinguishing a real provider callback from an
// attacker declaring that they have paid. Each case here maps to a 401, not a
// 400: the caller has not proven who they are.
func TestWebhookRouteRejectsUnverifiedCallers(t *testing.T) {
	t.Setenv("BILLING_ENABLED", "true")
	t.Setenv("BILLING_WEBHOOK_SECRET", webhookSecret)
	engine := billingEngine(t)

	body := []byte(`{"type":"payment_succeeded","id":"evt_route"}`)

	cases := []struct {
		name    string
		headers map[string]string
	}{
		{"no signature header at all", nil},
		{"signature from the wrong secret", map[string]string{"Stripe-Signature": signBody("wrong-secret", body)}},
		{"signature over a different body", map[string]string{"Stripe-Signature": signBody(webhookSecret, []byte(`{}`))}},
		{"empty signature header", map[string]string{"Stripe-Signature": ""}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := do(engine, http.MethodPost, "/api/v1/billing/webhooks/stripe", body, tc.headers)
			if rec.Code != http.StatusUnauthorized {
				t.Errorf("webhook with %s returned %d, want 401", tc.name, rec.Code)
			}
		})
	}
}

// TestWebhookRouteAcceptsSignedCallbacks proves the hardening did not simply
// break the endpoint: a correctly signed callback still succeeds, from each of
// the provider header names in use.
func TestWebhookRouteAcceptsSignedCallbacks(t *testing.T) {
	t.Setenv("BILLING_ENABLED", "true")
	t.Setenv("BILLING_WEBHOOK_SECRET", webhookSecret)
	engine := billingEngine(t)

	body := []byte(`{"type":"payment_succeeded","id":"evt_ok"}`)
	sig := signBody(webhookSecret, body)

	for _, header := range []string{
		"Stripe-Signature",
		"Paddle-Signature",
		"X-Razorpay-Signature",
		"X-Webhook-Signature",
	} {
		t.Run(header, func(t *testing.T) {
			rec := do(engine, http.MethodPost, "/api/v1/billing/webhooks/stripe", body,
				map[string]string{header: sig})
			if rec.Code != http.StatusOK {
				t.Errorf("correctly signed webhook via %s returned %d, want 200: %s",
					header, rec.Code, rec.Body.String())
			}
		})
	}
}

// TestWebhookBodyIsBounded: the endpoint is reachable by anyone, so the body it
// will read is capped before it is hashed. Beyond the cap the request is read
// truncated and therefore fails verification rather than being buffered whole.
func TestWebhookBodyIsBounded(t *testing.T) {
	t.Setenv("BILLING_ENABLED", "true")
	t.Setenv("BILLING_WEBHOOK_SECRET", webhookSecret)
	engine := billingEngine(t)

	oversized := bytes.Repeat([]byte("A"), maxWebhookBody+4096)
	rec := do(engine, http.MethodPost, "/api/v1/billing/webhooks/stripe", oversized,
		map[string]string{"Stripe-Signature": signBody(webhookSecret, oversized)})
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("oversized webhook body returned %d, want 401 (read truncated at the cap)", rec.Code)
	}
}
