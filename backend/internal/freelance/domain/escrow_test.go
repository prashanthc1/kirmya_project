package domain

import "testing"

// The escrow lifecycles' money rules, which a CHECK constraint cannot express.

// Money that has been released cannot be refunded, and a milestone cancelled
// by a refund cannot be revived. (A funded milestone may reach cancelled, but
// only through a refund - the service's CancelMilestone refuses it, which the
// service tests pin.)
func TestReleasedMoneyCannotBeRefunded(t *testing.T) {
	if MilestoneReleased.CanTransitionTo(MilestoneCancelled) {
		t.Error("a released milestone may be cancelled")
	}
	if PaymentReleased.CanTransitionTo(PaymentRefunded) {
		t.Error("released money may be refunded")
	}
	if !MilestonePending.CanTransitionTo(MilestoneCancelled) {
		t.Error("an unfunded milestone cannot be cancelled")
	}
}

func TestOnlyEscrowedMilestonesCanBeDisputed(t *testing.T) {
	for _, s := range []MilestoneStatus{MilestoneFunded, MilestoneInProgress, MilestoneSubmitted} {
		if !s.HoldsEscrow() || !s.CanTransitionTo(MilestoneDisputed) {
			t.Errorf("%s cannot be disputed", s)
		}
	}
	for _, s := range []MilestoneStatus{MilestonePending, MilestoneReleased, MilestoneCancelled} {
		if s.HoldsEscrow() {
			t.Errorf("%s reports holding escrow", s)
		}
	}
}

func TestUnfundedMilestoneCannotBeDeliveredOrReleased(t *testing.T) {
	for _, next := range []MilestoneStatus{MilestoneSubmitted, MilestoneInProgress, MilestoneReleased} {
		if MilestonePending.CanTransitionTo(next) {
			t.Errorf("pending -> %s is allowed; work would start before payment", next)
		}
	}
}

func TestReleasedAndCancelledAreTerminal(t *testing.T) {
	for _, from := range []MilestoneStatus{MilestoneReleased, MilestoneCancelled} {
		for _, to := range []MilestoneStatus{MilestonePending, MilestoneFunded, MilestoneSubmitted, MilestoneDisputed} {
			if from.CanTransitionTo(to) {
				t.Errorf("%s -> %s is allowed", from, to)
			}
		}
	}
}

// Money the processor has confirmed leaves escrow only to the freelancer or back
// to the client.
func TestHeldPaymentCannotFailOrBeCancelled(t *testing.T) {
	for _, next := range []PaymentIntentStatus{PaymentFailed, PaymentCancelled, PaymentRequiresPayment} {
		if PaymentHeldInEscrow.CanTransitionTo(next) {
			t.Errorf("held_in_escrow -> %s is allowed", next)
		}
	}
	if !PaymentHeldInEscrow.CanTransitionTo(PaymentReleased) || !PaymentHeldInEscrow.CanTransitionTo(PaymentRefunded) {
		t.Error("held money has no way out of escrow")
	}
}

func TestParseMilestoneStatusMatchesTheSchema(t *testing.T) {
	// Migration 0102's CHECK on freelance_contract_milestones.status.
	for _, value := range []string{"pending", "funded", "in_progress", "submitted", "approved", "released", "cancelled", "disputed"} {
		if _, ok := ParseMilestoneStatus(value); !ok {
			t.Errorf("%q is in the schema but not parsed", value)
		}
	}
	if _, ok := ParseMilestoneStatus("paid"); ok {
		t.Error("an unknown status was accepted")
	}
}

func TestSummarizeEscrow(t *testing.T) {
	contract := &Contract{TotalAmount: 100000, Currency: "AED"}
	summary := SummarizeEscrow(contract, []ContractMilestone{
		{Amount: 30000, Status: MilestoneReleased},
		{Amount: 25000, Status: MilestoneSubmitted},
		{Amount: 20000, Status: MilestonePending},
		{Amount: 50000, Status: MilestoneCancelled},
	})
	want := EscrowSummary{
		Currency: "AED", ContractTotal: 100000,
		Allocated: 75000, Unallocated: 25000, InEscrow: 25000, Released: 30000,
	}
	if summary != want {
		t.Fatalf("summary = %+v, want %+v", summary, want)
	}
}
