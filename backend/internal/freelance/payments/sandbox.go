package payments

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
)

// SandboxName is the provider value the sandbox gateway records.
const SandboxName = "sandbox"

// SandboxSignatureHeader carries the sandbox webhook's HMAC.
const SandboxSignatureHeader = "X-Kirmya-Signature"

// SandboxGateway is a processor that collects nothing.
//
// It exists so the escrow flow can run end to end without a processor account.
// It does not pretend money moved: CreateEscrowCharge only issues a reference,
// and a milestone is funded only when a webhook signed with the shared secret
// says so - the same verification a real processor's webhook would pass. FromEnv
// never returns it in production.
type SandboxGateway struct {
	secret []byte
}

// NewSandboxGateway builds the sandbox with its webhook secret.
func NewSandboxGateway(secret string) *SandboxGateway {
	return &SandboxGateway{secret: []byte(secret)}
}

func (g *SandboxGateway) Name() string { return SandboxName }

// CreateEscrowCharge issues a reference derived from the intent, so a retry for
// the same intent names the same charge rather than a second one.
func (g *SandboxGateway) CreateEscrowCharge(_ context.Context, req EscrowChargeRequest) (EscrowCharge, error) {
	return EscrowCharge{Reference: "sbx_" + req.IntentID.String()}, nil
}

// RefundEscrowCharge refunds nothing - the sandbox holds nothing - and issues a
// reference derived from the intent, so a retry names the same refund.
func (g *SandboxGateway) RefundEscrowCharge(_ context.Context, req RefundRequest) (string, error) {
	return "sbx_refund_" + req.IntentID.String(), nil
}

// sandboxEvent is the sandbox webhook body.
type sandboxEvent struct {
	Type      string `json:"type"`
	Reference string `json:"reference"`
}

// ParseWebhook verifies an HMAC-SHA256 of the raw body, in the "sha256=<hex>"
// shape processors commonly use, with a constant-time comparison.
func (g *SandboxGateway) ParseWebhook(payload []byte, headers http.Header) (WebhookEvent, error) {
	if len(g.secret) == 0 {
		return WebhookEvent{}, ErrInvalidSignature
	}
	supplied := strings.TrimPrefix(strings.TrimSpace(headers.Get(SandboxSignatureHeader)), "sha256=")
	if supplied == "" {
		return WebhookEvent{}, ErrInvalidSignature
	}
	if !hmac.Equal([]byte(SignSandboxPayload(g.secret, payload)), []byte(supplied)) {
		return WebhookEvent{}, ErrInvalidSignature
	}

	var event sandboxEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		return WebhookEvent{}, ErrMalformedEvent
	}
	kind := EventKind(event.Type)
	if (kind != ChargeSucceeded && kind != ChargeFailed) || strings.TrimSpace(event.Reference) == "" {
		return WebhookEvent{}, ErrMalformedEvent
	}
	return WebhookEvent{Kind: kind, Reference: event.Reference}, nil
}

// SignSandboxPayload returns the hex HMAC the sandbox expects for a body.
//
// Exported for tests and local tooling that play the processor's part.
func SignSandboxPayload(secret, payload []byte) string {
	mac := hmac.New(sha256.New, secret)
	mac.Write(payload)
	return hex.EncodeToString(mac.Sum(nil))
}
