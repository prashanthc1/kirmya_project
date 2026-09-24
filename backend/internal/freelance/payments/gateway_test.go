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

// Production gets no gateway until a real processor is integrated, whatever the
// environment says about the sandbox. Funding then answers 503 rather than
// accepting money nobody can collect.
func TestProductionHasNoGateway(t *testing.T) {
	env := func(string) string { return "a-secret" }
	if gw := FromEnv("production", env); gw != nil {
		t.Fatalf("production was given the %q gateway", gw.Name())
	}
	if gw := FromEnv(" Production ", env); gw != nil {
		t.Fatal("production spelled with whitespace and capitals was given a gateway")
	}
	if gw := FromEnv("prod", env); gw != nil {
		t.Fatal("the prod alias main.go accepts was given a gateway")
	}
}

// The sandbox needs its secret even outside production: an unsigned sandbox
// would let anyone mark a milestone paid.
func TestSandboxRequiresASecret(t *testing.T) {
	if gw := FromEnv("development", func(string) string { return "" }); gw != nil {
		t.Fatal("a sandbox was built with no webhook secret")
	}
	gw := FromEnv("development", func(string) string { return "s3cret" })
	if gw == nil || gw.Name() != SandboxName {
		t.Fatalf("development with a secret got %v, want the sandbox", gw)
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
