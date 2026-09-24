// Package payments is the freelance module's boundary with a payment processor.
//
// No processor has been chosen, so this package defines what the escrow flow
// needs from one and nothing more: take a client's money into escrow for a
// milestone, and tell us - in a way we can verify - whether that worked.
//
// The flow never trusts the client's browser about money. Funding a milestone
// asks the processor for a charge and records it as requires_payment; the
// milestone only becomes funded when the processor's signed webhook says the
// money arrived. A client that could mark its own milestone paid could get work
// for free.
package payments

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

var (
	// ErrNotConfigured means no processor is available in this deployment.
	// Funding is refused rather than simulated: a production deployment with no
	// processor must not accept milestone funding it cannot collect.
	ErrNotConfigured = errors.New("payments: no payment processor is configured")
	// ErrInvalidSignature means a webhook could not be verified as coming from
	// the processor. The caller answers 401 and changes nothing.
	ErrInvalidSignature = errors.New("payments: webhook signature is invalid")
	// ErrMalformedEvent means the webhook verified but its body is not an event
	// this module understands.
	ErrMalformedEvent = errors.New("payments: webhook event is malformed")
)

// EscrowChargeRequest asks the processor to collect a milestone's value.
type EscrowChargeRequest struct {
	IntentID    uuid.UUID
	ContractID  uuid.UUID
	MilestoneID uuid.UUID
	PayerID     uuid.UUID
	// AmountMinorUnits is in Currency's minor units, exactly as stored.
	AmountMinorUnits int64
	Currency         string
}

// EscrowCharge is the processor's handle on a requested charge.
type EscrowCharge struct {
	// Reference identifies the charge at the processor. Webhooks name it, and it
	// is unique per processor (uq_freelance_payment_intents_provider_ref).
	Reference string
	// CheckoutURL is where the client completes payment, when the processor
	// collects it on a hosted page.
	CheckoutURL string
}

// RefundRequest asks the processor to return a held charge to the payer.
type RefundRequest struct {
	IntentID uuid.UUID
	// Reference is the charge being refunded, as the processor named it.
	Reference        string
	AmountMinorUnits int64
	Currency         string
}

// EventKind is the outcome a webhook reports.
type EventKind string

const (
	// ChargeSucceeded: the money is held. This is what funds a milestone.
	ChargeSucceeded EventKind = "charge.succeeded"
	// ChargeFailed: the charge will not complete.
	ChargeFailed EventKind = "charge.failed"
)

// WebhookEvent is a verified notification from the processor.
type WebhookEvent struct {
	Kind      EventKind
	Reference string
}

// Gateway is one payment processor.
type Gateway interface {
	// Name is the provider value stored on each intent and the path segment its
	// webhooks arrive on. Lower-case, stable, never shown as a brand.
	Name() string
	// CreateEscrowCharge asks the processor to collect a milestone's value.
	//
	// An adapter for a real processor must make this idempotent per IntentID
	// (the processor's idempotency key) and attach IntentID to the charge's
	// metadata. The escrow service stores the returned Reference in a second
	// write; if that write fails after the processor created the charge, the
	// intent id on the charge is what lets it be reconciled rather than lost.
	CreateEscrowCharge(ctx context.Context, req EscrowChargeRequest) (EscrowCharge, error)
	// ParseWebhook verifies a webhook against the processor's signature and
	// returns the event it carries. It must fail closed: anything it cannot
	// verify is ErrInvalidSignature, never a best-effort parse. An adapter for a
	// real processor should also refuse a success whose captured amount or
	// currency differs from the charge it created.
	ParseWebhook(payload []byte, headers http.Header) (WebhookEvent, error)
	// RefundEscrowCharge returns a held charge to the payer in full and returns
	// the processor's reference for the refund.
	//
	// Called while the escrow rows are locked, and it must be idempotent per
	// IntentID: if the transaction recording the refund fails after the
	// processor accepted it, the retry must name the same refund rather than
	// return the money twice.
	RefundEscrowCharge(ctx context.Context, req RefundRequest) (string, error)
}

// FromEnv picks the gateway for a deployment.
//
// There is no production processor yet, so production gets none and funding
// answers 503 until one is integrated. Outside production the signed sandbox
// gateway is available when its webhook secret is set, which is what lets the
// whole escrow flow be exercised end to end in development and CI without a
// processor account. The secret is required even there: an unsigned sandbox
// would be a way to mark milestones paid by hand, which is exactly the thing
// the webhook exists to prevent.
func FromEnv(appEnv string, getenv func(string) string) Gateway {
	// Both spellings main.go treats as production.
	switch strings.ToLower(strings.TrimSpace(appEnv)) {
	case "production", "prod":
		return nil
	}
	secret := strings.TrimSpace(getenv("FREELANCE_SANDBOX_WEBHOOK_SECRET"))
	if secret == "" {
		return nil
	}
	return NewSandboxGateway(secret)
}
