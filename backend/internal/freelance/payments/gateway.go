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
	"fmt"
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
	// Description names the charge to the payer, on the processor's checkout
	// page and statement: the milestone's title.
	Description string
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
	// EventIgnored: a verified event the escrow flow does not act on. It is
	// acknowledged, so the processor stops redelivering it.
	EventIgnored EventKind = "ignored"
)

// WebhookEvent is a verified notification from the processor.
type WebhookEvent struct {
	Kind      EventKind
	Reference string
	// AmountMinorUnits and Currency are what the processor says it captured,
	// when it says. The service refuses a success that does not match the
	// charge it asked for. Zero when the processor does not report it.
	AmountMinorUnits int64
	Currency         string
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

// Provider names accepted in FREELANCE_PAYMENT_PROVIDER.
const (
	ProviderStripe  = StripeName
	ProviderSandbox = SandboxName
)

// ErrMisconfigured means the payment settings are unsafe or incomplete. The
// server refuses to start rather than run with them: a half-configured
// processor fails at the moment somebody tries to pay.
var ErrMisconfigured = errors.New("payments: misconfigured")

// FromEnv picks the gateway for a deployment.
//
// FREELANCE_PAYMENT_PROVIDER chooses:
//
//	stripe   Stripe Checkout. Needs STRIPE_SECRET_KEY and
//	         FREELANCE_STRIPE_WEBHOOK_SECRET. Production must use a live key and
//	         everywhere else a test key, so a development machine can never
//	         charge a real card and production never takes pretend money.
//	sandbox  Collects nothing; funds a milestone only on a webhook signed with
//	         FREELANCE_SANDBOX_WEBHOOK_SECRET. Refused in production.
//	(unset)  No processor, and funding answers 503 - except outside production,
//	         where a set FREELANCE_SANDBOX_WEBHOOK_SECRET still selects the
//	         sandbox, as it did before this setting existed.
//
// A nil gateway with a nil error is a deployment that takes no payments.
func FromEnv(appEnv, appBaseURL string, getenv func(string) string) (Gateway, error) {
	env := func(key string) string { return strings.TrimSpace(getenv(key)) }
	var production bool
	switch strings.ToLower(strings.TrimSpace(appEnv)) {
	case "production", "prod":
		production = true
	}

	switch provider := strings.ToLower(env("FREELANCE_PAYMENT_PROVIDER")); provider {
	case ProviderStripe:
		key, whsec := env("STRIPE_SECRET_KEY"), env("FREELANCE_STRIPE_WEBHOOK_SECRET")
		if key == "" || whsec == "" {
			return nil, fmt.Errorf("%w: stripe needs STRIPE_SECRET_KEY and FREELANCE_STRIPE_WEBHOOK_SECRET", ErrMisconfigured)
		}
		live := strings.HasPrefix(key, "sk_live_") || strings.HasPrefix(key, "rk_live_")
		if production && !live {
			return nil, fmt.Errorf("%w: production must use a live Stripe key", ErrMisconfigured)
		}
		if !production && live {
			return nil, fmt.Errorf("%w: a live Stripe key outside production would charge real cards", ErrMisconfigured)
		}
		if strings.TrimSpace(appBaseURL) == "" {
			return nil, fmt.Errorf("%w: stripe needs APP_BASE_URL to return clients from checkout", ErrMisconfigured)
		}
		return NewStripeGateway(StripeConfig{SecretKey: key, WebhookSecret: whsec, AppBaseURL: appBaseURL}), nil

	case ProviderSandbox:
		if production {
			return nil, fmt.Errorf("%w: the sandbox processor is refused in production", ErrMisconfigured)
		}
		secret := env("FREELANCE_SANDBOX_WEBHOOK_SECRET")
		if secret == "" {
			return nil, fmt.Errorf("%w: the sandbox needs FREELANCE_SANDBOX_WEBHOOK_SECRET", ErrMisconfigured)
		}
		return NewSandboxGateway(secret), nil

	case "":
		if production {
			return nil, nil
		}
		if secret := env("FREELANCE_SANDBOX_WEBHOOK_SECRET"); secret != "" {
			return NewSandboxGateway(secret), nil
		}
		return nil, nil

	default:
		return nil, fmt.Errorf("%w: unknown FREELANCE_PAYMENT_PROVIDER %q", ErrMisconfigured, provider)
	}
}
