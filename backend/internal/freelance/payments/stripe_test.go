package payments

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
)

// The Stripe gateway against a fake Stripe. What these pin is the request
// Stripe would receive - the key, the idempotency key, the amounts and the
// metadata that trace a charge back to its milestone - and that no webhook is
// believed without Stripe's signature.

type fakeStripe struct {
	t        *testing.T
	mu       sync.Mutex
	requests []recordedRequest
	respond  func(r *http.Request, form url.Values) (int, any)
}

type recordedRequest struct {
	method, path, auth, idempotencyKey string
	form                               url.Values
}

func (f *fakeStripe) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	f.mu.Lock()
	f.requests = append(f.requests, recordedRequest{
		method: r.Method, path: r.URL.Path, auth: r.Header.Get("Authorization"),
		idempotencyKey: r.Header.Get("Idempotency-Key"), form: r.PostForm,
	})
	f.mu.Unlock()
	status, body := f.respond(r, r.PostForm)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func newStripe(t *testing.T, respond func(r *http.Request, form url.Values) (int, any)) (*StripeGateway, *fakeStripe) {
	t.Helper()
	fake := &fakeStripe{t: t, respond: respond}
	server := httptest.NewServer(fake)
	t.Cleanup(server.Close)
	gw := NewStripeGateway(StripeConfig{
		SecretKey:     "sk_test_secret",
		WebhookSecret: "whsec_test",
		AppBaseURL:    "https://kirmya.example/",
		APIBase:       server.URL,
	})
	return gw, fake
}

func TestStripeCheckoutSession(t *testing.T) {
	gw, fake := newStripe(t, func(r *http.Request, _ url.Values) (int, any) {
		return 200, map[string]string{"id": "cs_test_1", "url": "https://checkout.stripe.com/c/pay/cs_test_1"}
	})
	req := EscrowChargeRequest{
		IntentID: uuid.New(), ContractID: uuid.New(), MilestoneID: uuid.New(),
		AmountMinorUnits: 60050, Currency: "AED", Description: "Design",
	}
	charge, err := gw.CreateEscrowCharge(context.Background(), req)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if charge.Reference != "cs_test_1" || charge.CheckoutURL != "https://checkout.stripe.com/c/pay/cs_test_1" {
		t.Fatalf("charge = %+v", charge)
	}

	got := fake.requests[0]
	if got.method != http.MethodPost || got.path != "/v1/checkout/sessions" {
		t.Fatalf("request = %s %s", got.method, got.path)
	}
	if got.auth != "Bearer sk_test_secret" {
		t.Errorf("authorization = %q", got.auth)
	}
	if got.idempotencyKey != "kirmya-escrow-charge-"+req.IntentID.String() {
		t.Errorf("idempotency key = %q", got.idempotencyKey)
	}
	want := map[string]string{
		"mode":                                            "payment",
		"line_items[0][quantity]":                         "1",
		"line_items[0][price_data][currency]":             "aed",
		"line_items[0][price_data][unit_amount]":          "60050",
		"line_items[0][price_data][product_data][name]":   "Design",
		"client_reference_id":                             req.IntentID.String(),
		"metadata[kirmya_intent_id]":                      req.IntentID.String(),
		"metadata[kirmya_milestone_id]":                   req.MilestoneID.String(),
		"payment_intent_data[metadata][kirmya_intent_id]": req.IntentID.String(),
		"success_url":                                     "https://kirmya.example/freelance/contracts/" + req.ContractID.String() + "?payment=success",
		"cancel_url":                                      "https://kirmya.example/freelance/contracts/" + req.ContractID.String() + "?payment=cancelled",
	}
	for key, value := range want {
		if got.form.Get(key) != value {
			t.Errorf("%s = %q, want %q", key, got.form.Get(key), value)
		}
	}
}

func TestStripeErrorsSurfaceWithoutTheKey(t *testing.T) {
	gw, _ := newStripe(t, func(*http.Request, url.Values) (int, any) {
		return 402, map[string]any{"error": map[string]string{"code": "amount_too_small", "message": "Amount must be at least 2.00 aed"}}
	})
	_, err := gw.CreateEscrowCharge(context.Background(), EscrowChargeRequest{IntentID: uuid.New(), AmountMinorUnits: 1, Currency: "AED"})
	if err == nil || !strings.Contains(err.Error(), "amount_too_small") {
		t.Fatalf("err = %v", err)
	}
	if strings.Contains(err.Error(), "sk_test_secret") {
		t.Fatal("the secret key leaked into an error")
	}
}

func TestStripeRefundGoesThroughTheSessionsPayment(t *testing.T) {
	intentID := uuid.New()
	gw, fake := newStripe(t, func(r *http.Request, form url.Values) (int, any) {
		switch r.URL.Path {
		case "/v1/checkout/sessions/cs_test_1":
			return 200, map[string]string{"id": "cs_test_1", "payment_intent": "pi_1"}
		case "/v1/refunds":
			return 200, map[string]string{"id": "re_1"}
		}
		return 404, map[string]any{"error": map[string]string{"message": "no such path"}}
	})
	ref, err := gw.RefundEscrowCharge(context.Background(), RefundRequest{IntentID: intentID, Reference: "cs_test_1", AmountMinorUnits: 60050, Currency: "AED"})
	if err != nil || ref != "re_1" {
		t.Fatalf("refund = %q, %v", ref, err)
	}
	refund := fake.requests[1]
	if refund.form.Get("payment_intent") != "pi_1" {
		t.Errorf("refunded payment = %q, want pi_1", refund.form.Get("payment_intent"))
	}
	if refund.idempotencyKey != "kirmya-escrow-refund-"+intentID.String() {
		t.Errorf("idempotency key = %q", refund.idempotencyKey)
	}
}

func TestStripeRefusesToRefundAnUnpaidSession(t *testing.T) {
	gw, fake := newStripe(t, func(*http.Request, url.Values) (int, any) {
		return 200, map[string]any{"id": "cs_test_1", "payment_intent": nil}
	})
	if _, err := gw.RefundEscrowCharge(context.Background(), RefundRequest{IntentID: uuid.New(), Reference: "cs_test_1"}); err == nil {
		t.Fatal("a session with no payment was reported refunded")
	}
	if len(fake.requests) != 1 {
		t.Fatalf("a refund was requested for a session with no payment")
	}
}

// signedStripe builds the header Stripe would send for body at time at.
func signedStripe(secret string, at time.Time, body []byte) http.Header {
	ts := strconv.FormatInt(at.Unix(), 10)
	h := http.Header{}
	h.Set(StripeSignatureHeader, "t="+ts+",v1="+SignStripePayload(secret, ts, body))
	return h
}

func stripeEventBody(eventType, paymentStatus string) []byte {
	body, _ := json.Marshal(map[string]any{
		"id": "evt_1", "type": eventType,
		"data": map[string]any{"object": map[string]any{
			"id": "cs_test_1", "object": "checkout.session", "payment_status": paymentStatus,
			"amount_total": 60050, "currency": "aed",
		}},
	})
	return body
}

func TestStripeWebhookSignature(t *testing.T) {
	now := time.Unix(1_790_000_000, 0)
	gw := NewStripeGateway(StripeConfig{SecretKey: "sk_test_x", WebhookSecret: "whsec_test", Now: func() time.Time { return now }})
	body := stripeEventBody("checkout.session.completed", "paid")

	event, err := gw.ParseWebhook(body, signedStripe("whsec_test", now, body))
	if err != nil {
		t.Fatalf("a genuine event was refused: %v", err)
	}
	if event.Kind != ChargeSucceeded || event.Reference != "cs_test_1" || event.AmountMinorUnits != 60050 || event.Currency != "AED" {
		t.Fatalf("event = %+v", event)
	}

	// While a secret is being rolled Stripe signs with both; either may match.
	ts := strconv.FormatInt(now.Unix(), 10)
	rolled := http.Header{}
	rolled.Set(StripeSignatureHeader, "t="+ts+",v1=deadbeef,v1="+SignStripePayload("whsec_test", ts, body))
	if _, err := gw.ParseWebhook(body, rolled); err != nil {
		t.Errorf("a header carrying the right signature second was refused: %v", err)
	}

	refused := map[string]http.Header{
		"no header":                  {},
		"wrong secret":               signedStripe("whsec_other", now, body),
		"another body":               signedStripe("whsec_test", now, stripeEventBody("checkout.session.completed", "unpaid")),
		"replayed ten minutes later": signedStripe("whsec_test", now.Add(-10*time.Minute), body),
		"from the future":            signedStripe("whsec_test", now.Add(10*time.Minute), body),
	}
	for name, headers := range refused {
		if _, err := gw.ParseWebhook(body, headers); !errors.Is(err, ErrInvalidSignature) {
			t.Errorf("%s: err = %v, want ErrInvalidSignature", name, err)
		}
	}
}

func TestStripeEventMapping(t *testing.T) {
	now := time.Now()
	gw := NewStripeGateway(StripeConfig{SecretKey: "sk_test_x", WebhookSecret: "whsec_test", Now: func() time.Time { return now }})
	cases := []struct {
		eventType, paymentStatus string
		want                     EventKind
	}{
		{"checkout.session.completed", "paid", ChargeSucceeded},
		// Delayed payment methods: not funded until the money settles.
		{"checkout.session.completed", "unpaid", EventIgnored},
		{"checkout.session.async_payment_succeeded", "paid", ChargeSucceeded},
		{"checkout.session.async_payment_failed", "unpaid", ChargeFailed},
		{"checkout.session.expired", "unpaid", ChargeFailed},
		{"customer.created", "", EventIgnored},
	}
	for _, tc := range cases {
		body := stripeEventBody(tc.eventType, tc.paymentStatus)
		event, err := gw.ParseWebhook(body, signedStripe("whsec_test", now, body))
		if err != nil {
			t.Fatalf("%s/%s: %v", tc.eventType, tc.paymentStatus, err)
		}
		if event.Kind != tc.want {
			t.Errorf("%s/%s = %q, want %q", tc.eventType, tc.paymentStatus, event.Kind, tc.want)
		}
	}
}
