package payments

import (
	"context"

	"github.com/google/uuid"
)

// Paying freelancers.
//
// Escrow collects the client's money into the platform's balance. A payout
// moves a released milestone's share of it to the freelancer, through an
// account the processor holds for them. The processor onboards that account on
// its own hosted pages, so identity documents and bank details go to the
// processor and never through Kirmya.

// PayoutAccountRequest asks the processor for an account to pay a user into.
type PayoutAccountRequest struct {
	UserID uuid.UUID
	Email  string
}

// PayoutAccountState is what the processor says about a payout account.
type PayoutAccountState struct {
	AccountID string
	// DetailsSubmitted: the freelancer finished the onboarding form.
	DetailsSubmitted bool
	// PayoutsEnabled: the processor will pay the account's balance out to the
	// freelancer's bank.
	PayoutsEnabled bool
	// TransfersActive: the platform may move money into the account.
	TransfersActive bool
	// RequirementsDue: the processor needs more from the freelancer now.
	RequirementsDue bool
	// DisabledReason is the processor's code for why the account cannot be
	// paid, when it cannot.
	DisabledReason string
}

// Ready reports whether money sent to the account will reach the freelancer.
// Both halves matter: a transfer into an account that cannot pay out strands
// the money in it.
func (s PayoutAccountState) Ready() bool {
	return s.TransfersActive && s.PayoutsEnabled
}

// PayoutRequest asks the processor to send one payout.
type PayoutRequest struct {
	PayoutID   uuid.UUID
	ContractID uuid.UUID
	// Destination is the payee's account, as the processor named it.
	Destination      string
	AmountMinorUnits int64
	Currency         string
	// SourceReference is the escrowed charge the money was collected by
	// (EscrowCharge.Reference), when known. A processor that can tie the payout
	// to it does, so the payout is funded by that charge and not by whatever
	// else is in the balance.
	SourceReference string
}

// PayoutGateway is a processor that can pay freelancers. A Gateway that also
// implements it enables payouts; one that does not leaves released payouts
// pending, as they were before payouts existed.
type PayoutGateway interface {
	// CreatePayoutAccount creates the account a user is paid into and returns
	// its id. Idempotent per user where the processor allows.
	CreatePayoutAccount(ctx context.Context, req PayoutAccountRequest) (string, error)
	// PayoutOnboardingLink returns a single-use address where the user
	// completes the account on the processor's pages. Empty when the processor
	// needs no onboarding.
	PayoutOnboardingLink(ctx context.Context, accountID string) (string, error)
	// GetPayoutAccount reads the account's current state from the processor.
	GetPayoutAccount(ctx context.Context, accountID string) (PayoutAccountState, error)
	// SendPayout moves money to the payee's account and returns the
	// processor's reference for the transfer.
	//
	// It must be idempotent per PayoutID: a send whose result was lost - the
	// server stopped after the processor accepted it - is retried, and the
	// retry must name the same transfer rather than pay twice.
	SendPayout(ctx context.Context, req PayoutRequest) (string, error)
}

// AccountUpdated is a verified event saying a payout account changed. Its
// WebhookEvent carries the new state in Account.
const AccountUpdated EventKind = "account.updated"
