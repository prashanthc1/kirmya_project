package payments

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// StripeName is the provider value the Stripe gateway records, and the path
// segment its webhooks arrive on: POST /api/v1/freelance/payments/webhooks/stripe.
const StripeName = "stripe"

// StripeSignatureHeader carries Stripe's webhook signature.
const StripeSignatureHeader = "Stripe-Signature"

// stripeSignatureTolerance is how old a signed webhook may be. Stripe signs the
// timestamp with the body, so an intercepted request cannot be replayed later.
const stripeSignatureTolerance = 5 * time.Minute

// StripeConfig configures the Stripe gateway.
type StripeConfig struct {
	// SecretKey is the platform account's secret API key (sk_live_... or
	// sk_test_...). It never leaves the server.
	SecretKey string
	// WebhookSecret is the signing secret of the webhook endpoint (whsec_...).
	WebhookSecret string
	// AppBaseURL is the web client's public address, where Checkout returns the
	// client after paying or cancelling.
	AppBaseURL string

	// APIBase overrides https://api.stripe.com, for tests.
	APIBase string
	// HTTPClient overrides the default client, for tests.
	HTTPClient *http.Client
	// Now overrides the clock the signature tolerance is measured against.
	Now func() time.Time
}

// StripeGateway collects milestone payments with Stripe Checkout into the
// platform's Stripe balance - the escrow - and refunds them from there.
//
// It uses Stripe's REST API directly rather than the stripe-go SDK: the escrow
// flow needs four calls, and a small, fully visible client is easier to review
// and to test against a fake server than a large dependency.
//
// Paying freelancers out of that balance (Connect transfers to their connected
// accounts) is not part of this gateway; releasing a milestone records a pending
// payout, which the payout work sends.
type StripeGateway struct {
	cfg    StripeConfig
	client *http.Client
	now    func() time.Time
}

// NewStripeGateway builds the gateway.
func NewStripeGateway(cfg StripeConfig) *StripeGateway {
	if cfg.APIBase == "" {
		cfg.APIBase = "https://api.stripe.com"
	}
	cfg.APIBase = strings.TrimRight(cfg.APIBase, "/")
	cfg.AppBaseURL = strings.TrimRight(cfg.AppBaseURL, "/")
	client := cfg.HTTPClient
	if client == nil {
		client = &http.Client{Timeout: 20 * time.Second}
	}
	now := cfg.Now
	if now == nil {
		now = time.Now
	}
	return &StripeGateway{cfg: cfg, client: client, now: now}
}

func (g *StripeGateway) Name() string { return StripeName }

// stripeError is the error body Stripe answers a refused request with.
type stripeError struct {
	Error struct {
		Type    string `json:"type"`
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// do sends one request. idempotencyKey makes a retried POST name the same
// object at Stripe rather than create a second one.
func (g *StripeGateway) do(ctx context.Context, method, path string, form url.Values, idempotencyKey string, out any) error {
	var body io.Reader
	if form != nil {
		body = strings.NewReader(form.Encode())
	}
	req, err := http.NewRequestWithContext(ctx, method, g.cfg.APIBase+path, body)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+g.cfg.SecretKey)
	if form != nil {
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	}
	if idempotencyKey != "" {
		req.Header.Set("Idempotency-Key", idempotencyKey)
	}

	resp, err := g.client.Do(req)
	if err != nil {
		return fmt.Errorf("stripe %s %s: %w", method, path, err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return err
	}
	if resp.StatusCode >= 300 {
		var se stripeError
		_ = json.Unmarshal(raw, &se)
		// Stripe's message and code, never the request: the request carries the key.
		return fmt.Errorf("stripe %s %s: %d %s %s", method, path, resp.StatusCode, se.Error.Code, se.Error.Message)
	}
	return json.Unmarshal(raw, out)
}

// CreateEscrowCharge opens a Checkout Session for the milestone.
//
// The session is the reference: webhooks name it, and the refund finds the
// payment through it. The intent id travels as client_reference_id and in the
// metadata of both the session and its PaymentIntent, and is the idempotency
// key, so a retry for the same intent returns the same session and a charge can
// always be traced back to the milestone it paid for.
func (g *StripeGateway) CreateEscrowCharge(ctx context.Context, req EscrowChargeRequest) (EscrowCharge, error) {
	if req.AmountMinorUnits <= 0 {
		return EscrowCharge{}, errors.New("stripe: amount must be positive")
	}
	name := strings.TrimSpace(req.Description)
	if name == "" {
		name = "Milestone payment"
	}
	contractPage := g.cfg.AppBaseURL + "/freelance/contracts/" + url.PathEscape(req.ContractID.String())

	form := url.Values{}
	form.Set("mode", "payment")
	form.Set("line_items[0][quantity]", "1")
	form.Set("line_items[0][price_data][currency]", strings.ToLower(req.Currency))
	form.Set("line_items[0][price_data][unit_amount]", strconv.FormatInt(req.AmountMinorUnits, 10))
	form.Set("line_items[0][price_data][product_data][name]", name)
	form.Set("success_url", contractPage+"?payment=success")
	form.Set("cancel_url", contractPage+"?payment=cancelled")
	form.Set("client_reference_id", req.IntentID.String())
	for _, prefix := range []string{"metadata", "payment_intent_data[metadata]"} {
		form.Set(prefix+"[kirmya_intent_id]", req.IntentID.String())
		form.Set(prefix+"[kirmya_contract_id]", req.ContractID.String())
		form.Set(prefix+"[kirmya_milestone_id]", req.MilestoneID.String())
	}

	var session struct {
		ID  string `json:"id"`
		URL string `json:"url"`
	}
	if err := g.do(ctx, http.MethodPost, "/v1/checkout/sessions", form,
		"kirmya-escrow-charge-"+req.IntentID.String(), &session); err != nil {
		return EscrowCharge{}, err
	}
	if session.ID == "" {
		return EscrowCharge{}, errors.New("stripe: checkout session has no id")
	}
	return EscrowCharge{Reference: session.ID, CheckoutURL: session.URL}, nil
}

// RefundEscrowCharge refunds the payment behind a Checkout Session in full.
func (g *StripeGateway) RefundEscrowCharge(ctx context.Context, req RefundRequest) (string, error) {
	var session struct {
		PaymentIntent string `json:"payment_intent"`
	}
	if err := g.do(ctx, http.MethodGet, "/v1/checkout/sessions/"+url.PathEscape(req.Reference), nil, "", &session); err != nil {
		return "", err
	}
	if session.PaymentIntent == "" {
		// A session with no payment has nothing to refund, and saying it was
		// refunded would record money moving that never moved.
		return "", errors.New("stripe: checkout session has no payment to refund")
	}

	form := url.Values{}
	form.Set("payment_intent", session.PaymentIntent)
	form.Set("metadata[kirmya_intent_id]", req.IntentID.String())
	var refund struct {
		ID string `json:"id"`
	}
	if err := g.do(ctx, http.MethodPost, "/v1/refunds", form,
		"kirmya-escrow-refund-"+req.IntentID.String(), &refund); err != nil {
		return "", err
	}
	if refund.ID == "" {
		return "", errors.New("stripe: refund has no id")
	}
	return refund.ID, nil
}

// stripeEvent is the part of a Stripe event the escrow flow reads.
type stripeEvent struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Data struct {
		Object struct {
			ID            string `json:"id"`
			Object        string `json:"object"`
			PaymentStatus string `json:"payment_status"`
			AmountTotal   int64  `json:"amount_total"`
			Currency      string `json:"currency"`
		} `json:"object"`
	} `json:"data"`
}

// ParseWebhook verifies a Stripe webhook and maps it onto the escrow's events.
//
// Verification follows Stripe's scheme: the Stripe-Signature header carries a
// timestamp and one or more v1 signatures, each an HMAC-SHA256 of
// "<timestamp>.<raw body>" under the endpoint's signing secret. Any matching v1
// is accepted (Stripe sends two while a secret is being rolled), comparison is
// constant-time, and a timestamp outside the tolerance is refused.
//
// Events the escrow flow does not act on verify and come back as EventIgnored,
// so they are acknowledged rather than retried by Stripe for days.
func (g *StripeGateway) ParseWebhook(payload []byte, headers http.Header) (WebhookEvent, error) {
	if err := verifyStripeSignature(payload, headers.Get(StripeSignatureHeader), g.cfg.WebhookSecret, g.now()); err != nil {
		return WebhookEvent{}, err
	}

	var event stripeEvent
	if err := json.Unmarshal(payload, &event); err != nil || event.Type == "" {
		return WebhookEvent{}, ErrMalformedEvent
	}
	obj := event.Data.Object
	if obj.Object != "checkout.session" || obj.ID == "" {
		return WebhookEvent{Kind: EventIgnored}, nil
	}

	settled := WebhookEvent{
		Reference:        obj.ID,
		AmountMinorUnits: obj.AmountTotal,
		Currency:         strings.ToUpper(obj.Currency),
	}
	switch event.Type {
	case "checkout.session.completed":
		// Card payments complete paid. Delayed methods complete "unpaid" and
		// settle later with async_payment_succeeded; the milestone is not
		// funded until the money is actually there.
		if obj.PaymentStatus != "paid" {
			return WebhookEvent{Kind: EventIgnored}, nil
		}
		settled.Kind = ChargeSucceeded
	case "checkout.session.async_payment_succeeded":
		settled.Kind = ChargeSucceeded
	case "checkout.session.async_payment_failed", "checkout.session.expired":
		settled.Kind = ChargeFailed
	default:
		return WebhookEvent{Kind: EventIgnored}, nil
	}
	return settled, nil
}

// verifyStripeSignature checks a Stripe-Signature header against the body.
func verifyStripeSignature(payload []byte, header, secret string, now time.Time) error {
	if secret == "" || header == "" {
		return ErrInvalidSignature
	}
	var timestamp string
	var signatures []string
	for _, part := range strings.Split(header, ",") {
		key, value, ok := strings.Cut(strings.TrimSpace(part), "=")
		if !ok {
			continue
		}
		switch key {
		case "t":
			timestamp = value
		case "v1":
			signatures = append(signatures, value)
		}
	}
	if timestamp == "" || len(signatures) == 0 {
		return ErrInvalidSignature
	}
	seconds, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return ErrInvalidSignature
	}
	age := now.Sub(time.Unix(seconds, 0))
	if age > stripeSignatureTolerance || age < -stripeSignatureTolerance {
		return ErrInvalidSignature
	}

	expected := []byte(SignStripePayload(secret, timestamp, payload))
	for _, candidate := range signatures {
		if hmac.Equal(expected, []byte(candidate)) {
			return nil
		}
	}
	return ErrInvalidSignature
}

// SignStripePayload returns the v1 signature Stripe would send for a body at a
// timestamp. Exported for tests and local tooling that play Stripe's part.
func SignStripePayload(secret, timestamp string, payload []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestamp))
	mac.Write([]byte("."))
	mac.Write(payload)
	return hex.EncodeToString(mac.Sum(nil))
}
