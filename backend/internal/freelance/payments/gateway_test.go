package payments

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/google/uuid"
)

func signedHeaders(secret string, body []byte) http.Header {
	h := http.Header{}
	h.Set(SandboxSignatureHeader, "sha256="+SignSandboxPayload([]byte(secret), body))
	return h
}

func envOf(values map[string]string) func(string) string {
	return func(key string) string { return values[key] }
}

// Which processor a deployment gets, and the settings it refuses to start with.
func TestFromEnv(t *testing.T) {
	const base = "https://kirmya.example"
	stripeTest := map[string]string{
		"FREELANCE_PAYMENT_PROVIDER": "stripe", "STRIPE_SECRET_KEY": "sk_test_123", "FREELANCE_STRIPE_WEBHOOK_SECRET": "whsec_1",
	}
	stripeLive := map[string]string{
		"FREELANCE_PAYMENT_PROVIDER": "stripe", "STRIPE_SECRET_KEY": "sk_live_123", "FREELANCE_STRIPE_WEBHOOK_SECRET": "whsec_1",
	}
	cases := []struct {
		name    string
		appEnv  string
		baseURL string
		env     map[string]string
		want    string // gateway name, "" for none
		wantErr bool
	}{
		{"production with nothing configured takes no payments", "production", base, nil, "", false},
		{"production ignores a stray sandbox secret", "production", base, map[string]string{"FREELANCE_SANDBOX_WEBHOOK_SECRET": "s"}, "", false},
		{"the prod alias is production", "prod", base, map[string]string{"FREELANCE_SANDBOX_WEBHOOK_SECRET": "s"}, "", false},
		{"development with nothing configured takes no payments", "development", base, nil, "", false},
		{"development keeps the legacy sandbox switch", "development", base, map[string]string{"FREELANCE_SANDBOX_WEBHOOK_SECRET": "s"}, SandboxName, false},
		{"sandbox chosen explicitly", "test", base, map[string]string{"FREELANCE_PAYMENT_PROVIDER": "sandbox", "FREELANCE_SANDBOX_WEBHOOK_SECRET": "s"}, SandboxName, false},
		{"sandbox without its secret is refused", "test", base, map[string]string{"FREELANCE_PAYMENT_PROVIDER": "sandbox"}, "", true},
		{"sandbox in production is refused", " Production ", base, map[string]string{"FREELANCE_PAYMENT_PROVIDER": "sandbox", "FREELANCE_SANDBOX_WEBHOOK_SECRET": "s"}, "", true},
		{"stripe with a test key outside production", "development", base, stripeTest, StripeName, false},
		{"stripe with a live key in production", "production", base, stripeLive, StripeName, false},
		{"a live key outside production is refused", "development", base, stripeLive, "", true},
		{"a test key in production is refused", "production", base, stripeTest, "", true},
		{"stripe without a webhook secret is refused", "development", base, map[string]string{"FREELANCE_PAYMENT_PROVIDER": "stripe", "STRIPE_SECRET_KEY": "sk_test_1"}, "", true},
		{"stripe without a return address is refused", "development", "", stripeTest, "", true},
		{"an unknown provider is refused", "development", base, map[string]string{"FREELANCE_PAYMENT_PROVIDER": "paypal"}, "", true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			gw, err := FromEnv(tc.appEnv, tc.baseURL, envOf(tc.env))
			if tc.wantErr {
				if !errors.Is(err, ErrMisconfigured) || gw != nil {
					t.Fatalf("got %v, %v; want ErrMisconfigured and no gateway", gw, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			got := ""
			if gw != nil {
				got = gw.Name()
			}
			if got != tc.want {
				t.Fatalf("gateway = %q, want %q", got, tc.want)
			}
		})
	}
}

func TestSandboxAcceptsOnlyCorrectlySignedEvents(t *testing.T) {
	gw := NewSandboxGateway("s3cret")
	body := []byte(`{"type":"charge.succeeded","reference":"sbx_1"}`)

	event, err := gw.ParseWebhook(body, signedHeaders("s3cret", body))
	if err != nil {
		t.Fatalf("a correctly signed event was refused: %v", err)
	}
	if event.Kind != ChargeSucceeded || event.Reference != "sbx_1" {
		t.Fatalf("event = %+v", event)
	}

	cases := map[string]http.Header{
		"no signature":              {},
		"wrong secret":              signedHeaders("other", body),
		"signature of another body": signedHeaders("s3cret", []byte(`{"type":"charge.succeeded","reference":"sbx_2"}`)),
	}
	for name, headers := range cases {
		if _, err := gw.ParseWebhook(body, headers); !errors.Is(err, ErrInvalidSignature) {
			t.Errorf("%s: err = %v, want ErrInvalidSignature", name, err)
		}
	}
}

func TestSandboxRejectsUnknownEvents(t *testing.T) {
	gw := NewSandboxGateway("s3cret")
	for _, body := range [][]byte{
		[]byte(`{"type":"charge.refunded","reference":"sbx_1"}`),
		[]byte(`{"type":"charge.succeeded","reference":""}`),
		[]byte(`not json`),
	} {
		if _, err := gw.ParseWebhook(body, signedHeaders("s3cret", body)); !errors.Is(err, ErrMalformedEvent) {
			t.Errorf("%s: err = %v, want ErrMalformedEvent", body, err)
		}
	}
}

// The reference is derived from the intent, so asking twice for one intent
// names one charge.
func TestSandboxChargeReferenceIsStablePerIntent(t *testing.T) {
	gw := NewSandboxGateway("s3cret")
	req := EscrowChargeRequest{IntentID: uuid.New(), AmountMinorUnits: 100, Currency: "AED"}
	first, _ := gw.CreateEscrowCharge(context.Background(), req)
	second, _ := gw.CreateEscrowCharge(context.Background(), req)
	if first.Reference == "" || first.Reference != second.Reference {
		t.Fatalf("references %q and %q for one intent", first.Reference, second.Reference)
	}
}
