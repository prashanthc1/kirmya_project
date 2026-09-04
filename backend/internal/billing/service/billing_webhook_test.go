package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"testing"

	"kirmya/internal/billing/repository"
)

// POST /api/v1/billing/webhooks/:provider cannot be protected by AuthRequired:
// a payment provider has no user token to present. The HMAC signature is
// therefore the whole of its authentication, and these tests are what stand
// between the endpoint and anyone on the internet asserting that a payment
// succeeded.
//
// Before this change the endpoint verified nothing at all: the handler passed a
// nil payload and an empty signature, ProcessWebhook never called
// VerifyWebhookSignature, and the provider's VerifyWebhookSignature returned
// true unconditionally. Each of the cases below fails if any one of those three
// regressions returns.

const testWebhookSecret = "whsec_test_secret_value"

func signPayload(t *testing.T, secret string, payload []byte) string {
	t.Helper()
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return hex.EncodeToString(mac.Sum(nil))
}

func enabledBillingService(t *testing.T, secret string) (BillingService, context.Context) {
	t.Helper()
	// The verification path is only reached when billing is on; with it off
	// ProcessWebhook is a no-op and would pass these tests vacuously.
	t.Setenv("BILLING_ENABLED", "true")
	t.Setenv("BILLING_WEBHOOK_SECRET", secret)
	return NewBillingService(repository.NewBillingRepository(nil)), context.Background()
}

func TestProcessWebhook_AcceptsCorrectlySignedPayload(t *testing.T) {
	svc, ctx := enabledBillingService(t, testWebhookSecret)
	payload := []byte(`{"type":"payment_succeeded","id":"evt_1"}`)

	if err := svc.ProcessWebhook(ctx, "stripe", payload, signPayload(t, testWebhookSecret, payload)); err != nil {
		t.Fatalf("a genuine provider callback was rejected: %v", err)
	}
}

func TestProcessWebhook_AcceptsSchemePrefixedSignature(t *testing.T) {
	svc, ctx := enabledBillingService(t, testWebhookSecret)
	payload := []byte(`{"type":"payment_succeeded","id":"evt_2"}`)

	// Providers commonly send "sha256=<hex>" rather than bare hex.
	sig := "sha256=" + signPayload(t, testWebhookSecret, payload)
	if err := svc.ProcessWebhook(ctx, "stripe", payload, sig); err != nil {
		t.Fatalf("scheme-prefixed signature was rejected: %v", err)
	}
}

func TestProcessWebhook_RejectsUnsignedRequest(t *testing.T) {
	svc, ctx := enabledBillingService(t, testWebhookSecret)

	err := svc.ProcessWebhook(ctx, "stripe", []byte(`{"type":"payment_succeeded"}`), "")
	if !errors.Is(err, ErrWebhookSignatureInvalid) {
		t.Fatalf("an unsigned webhook was accepted (err=%v); anyone could claim a payment succeeded", err)
	}
}

func TestProcessWebhook_RejectsForgedSignature(t *testing.T) {
	svc, ctx := enabledBillingService(t, testWebhookSecret)
	payload := []byte(`{"type":"payment_succeeded","id":"evt_3"}`)

	// An attacker who knows the scheme but not the secret.
	forged := signPayload(t, "attacker-guessed-secret", payload)
	if err := svc.ProcessWebhook(ctx, "stripe", payload, forged); !errors.Is(err, ErrWebhookSignatureInvalid) {
		t.Fatalf("a webhook signed with the wrong secret was accepted (err=%v)", err)
	}
}

func TestProcessWebhook_RejectsTamperedPayload(t *testing.T) {
	svc, ctx := enabledBillingService(t, testWebhookSecret)
	original := []byte(`{"type":"payment_failed","amount":100}`)
	sig := signPayload(t, testWebhookSecret, original)

	// Same signature, different body: the signature must cover the bytes.
	tampered := []byte(`{"type":"payment_succeeded","amount":100000}`)
	if err := svc.ProcessWebhook(ctx, "stripe", tampered, sig); !errors.Is(err, ErrWebhookSignatureInvalid) {
		t.Fatalf("a replayed signature over a rewritten body was accepted (err=%v)", err)
	}
}

func TestProcessWebhook_FailsClosedWithoutConfiguredSecret(t *testing.T) {
	svc, ctx := enabledBillingService(t, "")
	payload := []byte(`{"type":"payment_succeeded"}`)

	// With no secret there is nothing to verify against, so the only safe
	// behaviour is refusal — never "unconfigured means allow".
	if err := svc.ProcessWebhook(ctx, "stripe", payload, "any-signature"); !errors.Is(err, ErrWebhookSignatureInvalid) {
		t.Fatalf("webhooks were accepted with BILLING_WEBHOOK_SECRET unset (err=%v)", err)
	}
}

func TestProcessWebhook_StaysNoOpWhileBillingDisabled(t *testing.T) {
	t.Setenv("BILLING_ENABLED", "false")
	svc := NewBillingService(repository.NewBillingRepository(nil))

	// The existing contract: with billing off the endpoint records nothing and
	// reports success. Verification must not have turned that into an error.
	if err := svc.ProcessWebhook(context.Background(), "stripe", []byte(`{}`), ""); err != nil {
		t.Fatalf("disabled-billing no-op regressed: %v", err)
	}
}

func TestMockProviderVerifyWebhookSignature(t *testing.T) {
	provider := &MockPaymentProvider{}
	payload := []byte(`{"id":"evt_4"}`)
	valid := signPayload(t, testWebhookSecret, payload)

	cases := []struct {
		name      string
		payload   []byte
		signature string
		secret    string
		want      bool
	}{
		{"correct signature", payload, valid, testWebhookSecret, true},
		{"scheme prefix", payload, "sha256=" + valid, testWebhookSecret, true},
		{"empty signature", payload, "", testWebhookSecret, false},
		{"empty secret", payload, valid, "", false},
		{"wrong secret", payload, signPayload(t, "other", payload), testWebhookSecret, false},
		{"truncated signature", payload, valid[:20], testWebhookSecret, false},
		{"different payload", []byte(`{"id":"evt_5"}`), valid, testWebhookSecret, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := provider.VerifyWebhookSignature(tc.payload, tc.signature, tc.secret); got != tc.want {
				t.Errorf("VerifyWebhookSignature = %v, want %v", got, tc.want)
			}
		})
	}
}
