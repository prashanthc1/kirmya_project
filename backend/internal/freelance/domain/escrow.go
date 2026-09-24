package domain

import (
	"time"

	"github.com/google/uuid"
)

// The escrow lifecycles: a contract's milestones, the money that funds them, and
// the payouts that release it.
//
// Each vocabulary matches the CHECK constraint migration 0102 put on its table,
// and each transition table is the part a CHECK cannot say - that a released
// milestone is not funded again, or that money held in escrow is not quietly
// marked failed. The same pattern as states.go.

// MilestoneStatus is the lifecycle of one step of a contract's schedule.
type MilestoneStatus string

const (
	// MilestonePending is agreed but unfunded. The freelancer is not expected to
	// start work on it: nothing guarantees they will be paid.
	MilestonePending MilestoneStatus = "pending"
	// MilestoneFunded means the client's money is held in escrow for it. Only a
	// verified payment confirmation moves a milestone here - never the client's
	// own say-so.
	MilestoneFunded     MilestoneStatus = "funded"
	MilestoneInProgress MilestoneStatus = "in_progress"
	// MilestoneSubmitted means the freelancer has delivered and is waiting on the
	// client's review.
	MilestoneSubmitted MilestoneStatus = "submitted"
	// MilestoneApproved is in the schema for a release that happens later than
	// approval. Approval and release are one act today, so no path writes it.
	MilestoneApproved MilestoneStatus = "approved"
	// MilestoneReleased means the escrowed money is owed to the freelancer.
	MilestoneReleased  MilestoneStatus = "released"
	MilestoneCancelled MilestoneStatus = "cancelled"
	MilestoneDisputed  MilestoneStatus = "disputed"
)

// ParseMilestoneStatus rejects unknown values.
func ParseMilestoneStatus(value string) (MilestoneStatus, bool) {
	switch MilestoneStatus(normalize(value)) {
	case MilestonePending:
		return MilestonePending, true
	case MilestoneFunded:
		return MilestoneFunded, true
	case MilestoneInProgress:
		return MilestoneInProgress, true
	case MilestoneSubmitted:
		return MilestoneSubmitted, true
	case MilestoneApproved:
		return MilestoneApproved, true
	case MilestoneReleased:
		return MilestoneReleased, true
	case MilestoneCancelled:
		return MilestoneCancelled, true
	case MilestoneDisputed:
		return MilestoneDisputed, true
	}
	return "", false
}

// milestoneTransitions.
//
// A funded milestone reaches cancelled only by refunding the client - the
// freelancer giving the money back, or a dispute decided in the client's
// favour. The service enforces that: CancelMilestone itself only ever cancels
// an unfunded one, so money is never left in escrow against a cancelled step.
//
// submitted -> in_progress is the revision loop, and like the contract's it may
// go round more than once. A disputed milestone returns to wherever it was when
// the dispute was withdrawn, or moves on as the dispute is decided.
var milestoneTransitions = map[MilestoneStatus][]MilestoneStatus{
	MilestonePending:    {MilestoneFunded, MilestoneCancelled},
	MilestoneFunded:     {MilestoneInProgress, MilestoneSubmitted, MilestoneDisputed, MilestoneCancelled},
	MilestoneInProgress: {MilestoneSubmitted, MilestoneDisputed, MilestoneCancelled},
	MilestoneSubmitted:  {MilestoneInProgress, MilestoneApproved, MilestoneReleased, MilestoneDisputed, MilestoneCancelled},
	MilestoneApproved:   {MilestoneReleased, MilestoneDisputed},
	MilestoneDisputed:   {MilestoneFunded, MilestoneInProgress, MilestoneSubmitted, MilestoneReleased, MilestoneCancelled},
	// Terminal.
	MilestoneReleased:  nil,
	MilestoneCancelled: nil,
}

func (s MilestoneStatus) CanTransitionTo(next MilestoneStatus) bool {
	return allowed(milestoneTransitions[s], s, next)
}

// HoldsEscrow reports whether the client's money is held for the milestone
// and it is still in play - the states a dispute or a refund can reach.
func (s MilestoneStatus) HoldsEscrow() bool {
	return s == MilestoneFunded || s == MilestoneInProgress || s == MilestoneSubmitted
}

func (s MilestoneStatus) IsTerminal() bool {
	return s == MilestoneReleased || s == MilestoneCancelled
}

// CountsTowardsContract reports whether the milestone's amount is part of the
// contract's allocated value. A cancelled milestone gives its share back.
func (s MilestoneStatus) CountsTowardsContract() bool {
	return s != MilestoneCancelled
}

// PaymentIntentStatus is the lifecycle of money moving into escrow.
type PaymentIntentStatus string

const (
	// PaymentRequiresPayment: the processor has been asked, the client has not
	// paid yet.
	PaymentRequiresPayment PaymentIntentStatus = "requires_payment"
	PaymentProcessing      PaymentIntentStatus = "processing"
	// PaymentHeldInEscrow: the processor has confirmed the money. This is the
	// only state that funds a milestone.
	PaymentHeldInEscrow PaymentIntentStatus = "held_in_escrow"
	PaymentReleased     PaymentIntentStatus = "released"
	PaymentRefunded     PaymentIntentStatus = "refunded"
	PaymentFailed       PaymentIntentStatus = "failed"
	PaymentCancelled    PaymentIntentStatus = "cancelled"
)

// ParsePaymentIntentStatus rejects unknown values.
func ParsePaymentIntentStatus(value string) (PaymentIntentStatus, bool) {
	switch PaymentIntentStatus(normalize(value)) {
	case PaymentRequiresPayment:
		return PaymentRequiresPayment, true
	case PaymentProcessing:
		return PaymentProcessing, true
	case PaymentHeldInEscrow:
		return PaymentHeldInEscrow, true
	case PaymentReleased:
		return PaymentReleased, true
	case PaymentRefunded:
		return PaymentRefunded, true
	case PaymentFailed:
		return PaymentFailed, true
	case PaymentCancelled:
		return PaymentCancelled, true
	}
	return "", false
}

// paymentIntentTransitions.
//
// Money held in escrow leaves it in exactly two ways: to the freelancer
// (released) or back to the client (refunded). It cannot fail or be cancelled
// once the processor has confirmed it, because by then it is real money.
var paymentIntentTransitions = map[PaymentIntentStatus][]PaymentIntentStatus{
	PaymentRequiresPayment: {PaymentProcessing, PaymentHeldInEscrow, PaymentFailed, PaymentCancelled},
	PaymentProcessing:      {PaymentHeldInEscrow, PaymentFailed},
	PaymentHeldInEscrow:    {PaymentReleased, PaymentRefunded},
	// Terminal.
	PaymentReleased:  nil,
	PaymentRefunded:  nil,
	PaymentFailed:    nil,
	PaymentCancelled: nil,
}

func (s PaymentIntentStatus) CanTransitionTo(next PaymentIntentStatus) bool {
	return allowed(paymentIntentTransitions[s], s, next)
}

// IsLive reports whether the intent still holds, or may still collect, money for
// its milestone. At most one live intent may exist per milestone - migration
// 0103 enforces it - so a client cannot be charged twice for the same step.
func (s PaymentIntentStatus) IsLive() bool {
	return s == PaymentRequiresPayment || s == PaymentProcessing || s == PaymentHeldInEscrow
}

// PayoutStatus is the lifecycle of money leaving escrow towards a freelancer.
type PayoutStatus string

const (
	// PayoutPending: owed and recorded, not yet sent - waiting for the payee's
	// payout account, or for the next attempt after a failed send.
	PayoutPending PayoutStatus = "pending"
	// PayoutProcessing: claimed by the sender, which is asking the processor.
	PayoutProcessing PayoutStatus = "processing"
	// PayoutPaid: the processor accepted the transfer to the payee's account.
	PayoutPaid PayoutStatus = "paid"
	// PayoutFailed: sending failed repeatedly and has stopped. An
	// administrator retries it once the cause is fixed.
	PayoutFailed    PayoutStatus = "failed"
	PayoutCancelled PayoutStatus = "cancelled"
)

// IsUnpaid reports whether the payout is still owed: recorded and not sent.
func (s PayoutStatus) IsUnpaid() bool {
	return s == PayoutPending || s == PayoutProcessing || s == PayoutFailed
}

// ValidPayoutStatus reports whether s is a payout status.
func ValidPayoutStatus(s string) bool {
	switch PayoutStatus(s) {
	case PayoutPending, PayoutProcessing, PayoutPaid, PayoutFailed, PayoutCancelled:
		return true
	}
	return false
}

// PayoutAccountStatus is where a freelancer's payout account stands, as they
// see it.
type PayoutAccountStatus string

const (
	// PayoutAccountNotStarted: no account yet. Released payouts wait.
	PayoutAccountNotStarted PayoutAccountStatus = "not_started"
	// PayoutAccountOnboarding: the account exists and the freelancer has not
	// finished the processor's form.
	PayoutAccountOnboarding PayoutAccountStatus = "onboarding"
	// PayoutAccountActionRequired: the processor needs more from the freelancer.
	PayoutAccountActionRequired PayoutAccountStatus = "action_required"
	// PayoutAccountInReview: everything is submitted and the processor is
	// verifying it.
	PayoutAccountInReview PayoutAccountStatus = "in_review"
	// PayoutAccountEnabled: payouts are sent.
	PayoutAccountEnabled PayoutAccountStatus = "enabled"
)

// PayoutAccount is a freelancer's account at the payment processor.
//
// Kirmya holds the processor's id for it and the processor's last word on its
// state; identity and bank details stay with the processor.
type PayoutAccount struct {
	UserID           uuid.UUID `json:"-"`
	Provider         string    `json:"provider"`
	AccountID        string    `json:"-"`
	DetailsSubmitted bool      `json:"details_submitted"`
	PayoutsEnabled   bool      `json:"payouts_enabled"`
	TransfersActive  bool      `json:"transfers_active"`
	RequirementsDue  bool      `json:"requirements_due"`
	DisabledReason   string    `json:"disabled_reason,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// Ready reports whether payouts to the account are sent.
func (a *PayoutAccount) Ready() bool {
	return a != nil && a.TransfersActive && a.PayoutsEnabled
}

// Status summarises the account for its owner.
func (a *PayoutAccount) Status() PayoutAccountStatus {
	switch {
	case a == nil:
		return PayoutAccountNotStarted
	case a.Ready():
		return PayoutAccountEnabled
	case !a.DetailsSubmitted:
		return PayoutAccountOnboarding
	case a.RequirementsDue:
		return PayoutAccountActionRequired
	}
	return PayoutAccountInReview
}

// PayoutAccountView is GET /freelance/payouts/account: the account, when there
// is one, and what it means for the freelancer's money.
type PayoutAccountView struct {
	// Available is false when this deployment cannot send payouts at all.
	Available bool                `json:"available"`
	Status    PayoutAccountStatus `json:"status"`
	Account   *PayoutAccount      `json:"account,omitempty"`
	// Waiting is what has been released to the freelancer and not yet sent,
	// per currency, in minor units serialized as decimals.
	Waiting map[string]Amount `json:"waiting"`
}

// PayoutOnboarding is POST /freelance/payouts/account/onboarding.
type PayoutOnboarding struct {
	// URL is the processor's onboarding page. Empty when there is nothing to
	// fill in (the sandbox), in which case the account is already refreshed.
	URL     string            `json:"url,omitempty"`
	Account PayoutAccountView `json:"account"`
}

// DeliveryStatus is the client's verdict on one submission of work.
type DeliveryStatus string

const (
	DeliverySubmitted         DeliveryStatus = "submitted"
	DeliveryAccepted          DeliveryStatus = "accepted"
	DeliveryRevisionRequested DeliveryStatus = "revision_requested"
	DeliveryRejected          DeliveryStatus = "rejected"
)

// CreateMilestonePayload is the client's request to add a step to a contract.
//
// There is no currency field: a milestone is in the contract's currency, and
// accepting a second one would make the contract's total a sum of two different
// things.
type CreateMilestonePayload struct {
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	Amount      Amount     `json:"amount"`
	DueAt       *time.Time `json:"due_at"`
}

// SubmitMilestonePayload is the freelancer's delivery of work for a milestone.
type SubmitMilestonePayload struct {
	Summary     string   `json:"summary" binding:"required"`
	Attachments []string `json:"attachments"`
}

// RequestRevisionPayload is the client sending a submission back.
type RequestRevisionPayload struct {
	Reason string `json:"reason" binding:"required"`
}

// EscrowSummary is where a contract's money stands, in the contract's currency.
//
// Computed from the milestones on every read rather than stored, so it cannot
// drift from the rows it describes.
type EscrowSummary struct {
	Currency string `json:"currency"`
	// ContractTotal is the agreed value of the whole contract.
	ContractTotal Amount `json:"contract_total"`
	// Allocated is the sum of every milestone that has not been cancelled.
	Allocated Amount `json:"allocated"`
	// Unallocated is what the client may still schedule into new milestones.
	Unallocated Amount `json:"unallocated"`
	// InEscrow is funded and not yet released.
	InEscrow Amount `json:"in_escrow"`
	// Released is owed to the freelancer.
	Released Amount `json:"released"`
}

// ContractDetail is one contract as a party to it sees it.
type ContractDetail struct {
	Contract
	Milestones []ContractMilestone `json:"milestones"`
	Escrow     EscrowSummary       `json:"escrow"`
}

// SummarizeEscrow totals a contract's milestones.
func SummarizeEscrow(contract *Contract, milestones []ContractMilestone) EscrowSummary {
	summary := EscrowSummary{Currency: contract.Currency, ContractTotal: contract.TotalAmount}
	for _, m := range milestones {
		if !m.Status.CountsTowardsContract() {
			continue
		}
		summary.Allocated += m.Amount
		switch m.Status {
		case MilestoneFunded, MilestoneInProgress, MilestoneSubmitted, MilestoneApproved, MilestoneDisputed:
			summary.InEscrow += m.Amount
		case MilestoneReleased:
			summary.Released += m.Amount
		}
	}
	summary.Unallocated = contract.TotalAmount - summary.Allocated
	if summary.Unallocated < 0 {
		summary.Unallocated = 0
	}
	return summary
}

// FundingResult is what the client needs to pay for a milestone.
type FundingResult struct {
	Intent PaymentIntent `json:"payment_intent"`
	// CheckoutURL is where the processor collects the payment. Empty when the
	// processor collects it some other way.
	CheckoutURL string `json:"checkout_url,omitempty"`
}
