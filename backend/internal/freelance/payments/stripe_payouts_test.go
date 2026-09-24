package payments

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"testing"
	"time"

	"github.com/google/uuid"
)

// Connect payouts against the fake Stripe: the accounts freelancers are paid
// into, and the transfers that pay them.

func TestStripeCreatePayoutAccount(t *testing.T) {
	gw, fake := newStripe(t, func(*http.Request, url.Values) (int, any) {
		return 200, map[string]string{"id": "acct_123"}
	})
	user := uuid.New()
	id, err := gw.CreatePayoutAccount(context.Background(), PayoutAccountRequest{UserID: user})
	if err != nil || id != "acct_123" {
		t.Fatalf("account = %q, %v", id, err)
	}
	got := fake.requests[0]
	if got.method != http.MethodPost || got.path != "/v1/accounts" {
		t.Fatalf("request = %s %s", got.method, got.path)
	}
	// One account per user, however many times they click.
	if got.idempotencyKey != "kirmya-payout-account-"+user.String() {
		t.Errorf("idempotency key = %q", got.idempotencyKey)
	}
	for key, want := range map[string]string{
		"type":                               "express",
		"capabilities[transfers][requested]": "true",
		"metadata[kirmya_user_id]":           user.String(),
	} {
		if v := got.form.Get(key); v != want {
			t.Errorf("%s = %q, want %q", key, v, want)
		}
	}
}

func TestStripeOnboardingLinkReturnsToThePayoutsPage(t *testing.T) {
	gw, fake := newStripe(t, func(*http.Request, url.Values) (int, any) {
		return 200, map[string]string{"url": "https://connect.stripe.com/setup/e/acct_123/x"}
	})
	link, err := gw.PayoutOnboardingLink(context.Background(), "acct_123")
	if err != nil || link != "https://connect.stripe.com/setup/e/acct_123/x" {
		t.Fatalf("link = %q, %v", link, err)
	}
	got := fake.requests[0]
	if got.path != "/v1/account_links" {
		t.Fatalf("path = %s", got.path)
	}
	for key, want := range map[string]string{
		"account":     "acct_123",
		"type":        "account_onboarding",
		"return_url":  "https://kirmya.example/freelance/payouts?onboarding=return",
		"refresh_url": "https://kirmya.example/freelance/payouts?onboarding=refresh",
	} {
		if v := got.form.Get(key); v != want {
			t.Errorf("%s = %q, want %q", key, v, want)
		}
	}
}

func stripeAccountObject(transfers string, payoutsEnabled bool, due []string) map[string]any {
	return map[string]any{
		"id": "acct_123", "object": "account",
		"details_submitted": true, "payouts_enabled": payoutsEnabled,
		"capabilities": map[string]any{"transfers": transfers},
		"requirements": map[string]any{"currently_due": due, "past_due": []string{}, "disabled_reason": nil},
	}
}

func TestStripePayoutAccountState(t *testing.T) {
	cases := []struct {
		name      string
		account   map[string]any
		wantReady bool
		wantDue   bool
	}{
		{"ready", stripeAccountObject("active", true, nil), true, false},
		// Money transferred into an account that cannot pay out would be
		// stranded there: not ready until both are true.
		{"transfers without payouts", stripeAccountObject("active", false, nil), false, false},
		{"payouts without transfers", stripeAccountObject("pending", true, nil), false, false},
		{"more information needed", stripeAccountObject("inactive", false, []string{"individual.id_number"}), false, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			gw, fake := newStripe(t, func(*http.Request, url.Values) (int, any) { return 200, tc.account })
			state, err := gw.GetPayoutAccount(context.Background(), "acct_123")
			if err != nil {
				t.Fatal(err)
			}
			if fake.requests[0].method != http.MethodGet || fake.requests[0].path != "/v1/accounts/acct_123" {
				t.Fatalf("request = %+v", fake.requests[0])
			}
			if state.Ready() != tc.wantReady || state.RequirementsDue != tc.wantDue || state.AccountID != "acct_123" {
				t.Errorf("state = %+v", state)
			}
		})
	}
}

func TestStripeSendPayoutIsTiedToTheEscrowedCharge(t *testing.T) {
	var expanded string
	gw, fake := newStripe(t, func(r *http.Request, _ url.Values) (int, any) {
		switch r.URL.Path {
		case "/v1/checkout/sessions/cs_test_1":
			expanded = r.URL.Query().Get("expand[]")
			return 200, map[string]any{"id": "cs_test_1", "payment_intent": map[string]any{"id": "pi_1", "latest_charge": "ch_1"}}
		case "/v1/transfers":
			return 200, map[string]string{"id": "tr_1"}
		}
		return 404, map[string]any{}
	})
	req := PayoutRequest{
		PayoutID: uuid.New(), ContractID: uuid.New(), Destination: "acct_123",
		AmountMinorUnits: 60050, Currency: "AED", SourceReference: "cs_test_1",
	}
	ref, err := gw.SendPayout(context.Background(), req)
	if err != nil || ref != "tr_1" {
		t.Fatalf("transfer = %q, %v", ref, err)
	}
	if expanded != "payment_intent" {
		t.Errorf("session read without expanding its payment: expand[] = %q", expanded)
	}
	transfer := fake.requests[1]
	if transfer.method != http.MethodPost || transfer.path != "/v1/transfers" {
		t.Fatalf("request = %s %s", transfer.method, transfer.path)
	}
	// A retry names the same transfer rather than paying twice.
	if transfer.idempotencyKey != "kirmya-payout-"+req.PayoutID.String() {
		t.Errorf("idempotency key = %q", transfer.idempotencyKey)
	}
	for key, want := range map[string]string{
		"amount":                     "60050",
		"currency":                   "aed",
		"destination":                "acct_123",
		"source_transaction":         "ch_1",
		"transfer_group":             "kirmya-contract-" + req.ContractID.String(),
		"metadata[kirmya_payout_id]": req.PayoutID.String(),
	} {
		if v := transfer.form.Get(key); v != want {
			t.Errorf("%s = %q, want %q", key, v, want)
		}
	}
}

func TestStripeSendPayoutWithoutASourceUsesTheBalance(t *testing.T) {
	gw, fake := newStripe(t, func(*http.Request, url.Values) (int, any) {
		return 200, map[string]string{"id": "tr_2"}
	})
	if _, err := gw.SendPayout(context.Background(), PayoutRequest{
		PayoutID: uuid.New(), Destination: "acct_123", AmountMinorUnits: 100, Currency: "AED",
	}); err != nil {
		t.Fatal(err)
	}
	if len(fake.requests) != 1 || fake.requests[0].form.Has("source_transaction") {
		t.Fatalf("requests = %+v", fake.requests)
	}
}

func TestStripeSendPayoutRefusals(t *testing.T) {
	gw, fake := newStripe(t, func(*http.Request, url.Values) (int, any) {
		return 400, map[string]any{"error": map[string]string{"code": "balance_insufficient", "message": "Insufficient funds"}}
	})
	_, err := gw.SendPayout(context.Background(), PayoutRequest{
		PayoutID: uuid.New(), Destination: "acct_123", AmountMinorUnits: 100, Currency: "AED",
	})
	if err == nil {
		t.Fatal("a refused transfer was reported sent")
	}
	for name, req := range map[string]PayoutRequest{
		"no amount":      {PayoutID: uuid.New(), Destination: "acct_123", Currency: "AED"},
		"no destination": {PayoutID: uuid.New(), AmountMinorUnits: 100, Currency: "AED"},
	} {
		if _, err := gw.SendPayout(context.Background(), req); err == nil {
			t.Errorf("%s: sent", name)
		}
	}
	if len(fake.requests) != 1 {
		t.Errorf("an invalid payout reached Stripe: %d requests", len(fake.requests))
	}
}

func accountUpdatedBody(account map[string]any) []byte {
	body, _ := json.Marshal(map[string]any{
		"id": "evt_2", "type": "account.updated", "account": "acct_123",
		"data": map[string]any{"object": account},
	})
	return body
}

func TestStripeAccountUpdatedWebhook(t *testing.T) {
	now := time.Unix(1_790_000_000, 0)
	gw := NewStripeGateway(StripeConfig{
		SecretKey: "sk_test_x", WebhookSecret: "whsec_platform", ConnectWebhookSecret: "whsec_connect",
		Now: func() time.Time { return now },
	})
	body := accountUpdatedBody(stripeAccountObject("active", true, nil))

	// Stripe signs connected accounts' events with the Connect endpoint's
	// secret; the platform endpoint's secret still verifies its own events.
	event, err := gw.ParseWebhook(body, signedStripe("whsec_connect", now, body))
	if err != nil {
		t.Fatalf("a Connect event was refused: %v", err)
	}
	if event.Kind != AccountUpdated || event.Reference != "acct_123" || event.Account == nil || !event.Account.Ready() {
		t.Fatalf("event = %+v", event)
	}
	if _, err := gw.ParseWebhook(body, signedStripe("whsec_platform", now, body)); err != nil {
		t.Errorf("the platform secret was refused: %v", err)
	}
	if _, err := gw.ParseWebhook(body, signedStripe("whsec_other", now, body)); !errors.Is(err, ErrInvalidSignature) {
		t.Errorf("an unknown secret: err = %v", err)
	}

	// Without a Connect secret configured, only the platform secret verifies.
	platformOnly := NewStripeGateway(StripeConfig{SecretKey: "sk_test_x", WebhookSecret: "whsec_platform", Now: func() time.Time { return now }})
	if _, err := platformOnly.ParseWebhook(body, signedStripe("whsec_connect", now, body)); !errors.Is(err, ErrInvalidSignature) {
		t.Errorf("a Connect-signed event verified with no Connect secret configured: %v", err)
	}
}

func TestFromEnvReadsTheConnectSecret(t *testing.T) {
	env := map[string]string{
		"FREELANCE_PAYMENT_PROVIDER":              "stripe",
		"STRIPE_SECRET_KEY":                       "sk_test_x",
		"FREELANCE_STRIPE_WEBHOOK_SECRET":         "whsec_platform",
		"FREELANCE_STRIPE_CONNECT_WEBHOOK_SECRET": "whsec_connect",
	}
	gw, err := FromEnv("development", "https://kirmya.example", func(k string) string { return env[k] })
	if err != nil {
		t.Fatal(err)
	}
	stripe, ok := gw.(*StripeGateway)
	if !ok || stripe.cfg.ConnectWebhookSecret != "whsec_connect" {
		t.Fatalf("gateway = %#v", gw)
	}
	if _, ok := gw.(PayoutGateway); !ok {
		t.Error("the Stripe gateway cannot pay freelancers")
	}
}

func TestSandboxPayouts(t *testing.T) {
	gw := NewSandboxGateway("secret")
	user, payout := uuid.New(), uuid.New()
	account, _ := gw.CreatePayoutAccount(context.Background(), PayoutAccountRequest{UserID: user})
	again, _ := gw.CreatePayoutAccount(context.Background(), PayoutAccountRequest{UserID: user})
	if account == "" || account != again {
		t.Errorf("sandbox accounts = %q, %q", account, again)
	}
	if state, _ := gw.GetPayoutAccount(context.Background(), account); !state.Ready() {
		t.Error("a sandbox account is not ready")
	}
	first, _ := gw.SendPayout(context.Background(), PayoutRequest{PayoutID: payout})
	second, _ := gw.SendPayout(context.Background(), PayoutRequest{PayoutID: payout})
	if first == "" || first != second {
		t.Errorf("sandbox transfers = %q, %q", first, second)
	}
}
