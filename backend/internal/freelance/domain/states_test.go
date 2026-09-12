package domain

import "testing"

// The lifecycles, and the moves they must refuse.
//
// A CHECK constraint in migration 0102 says "status is one of these". It cannot
// say "a cancelled project does not become active again", which is what these
// tests cover: the transition tables are the only thing standing between a
// caller and a state the product has no meaning for.

func TestParseRejectsUnknownStatuses(t *testing.T) {
	if _, ok := ParseProjectStatus("open"); ok {
		// 'open' was the 0032 vocabulary and migration 0102 maps it onto
		// 'accepting_proposals'. Accepting it here would let the old value back
		// in through the API after the database had been migrated away from it.
		t.Error("ParseProjectStatus accepted the retired value 'open'")
	}
	for _, value := range []string{"", "nonsense", "DRAFTED", "in-progress"} {
		if _, ok := ParseProjectStatus(value); ok {
			t.Errorf("ParseProjectStatus(%q) accepted an unknown value", value)
		}
	}
	// Case and surrounding whitespace are tolerated; the value is not.
	if got, ok := ParseProjectStatus("  Draft "); !ok || got != ProjectDraft {
		t.Errorf("ParseProjectStatus('  Draft ') = %q, %v; want draft, true", got, ok)
	}
}

func TestProjectTerminalStatesAreTerminal(t *testing.T) {
	// The rule that stops a finished engagement being silently reopened and
	// re-billed.
	for _, terminal := range []ProjectStatus{ProjectCompleted, ProjectCancelled} {
		if !terminal.IsTerminal() {
			t.Errorf("%s does not report itself terminal", terminal)
		}
		for _, next := range []ProjectStatus{
			ProjectDraft, ProjectPublished, ProjectAcceptingProposals,
			ProjectHired, ProjectActive, ProjectDisputed,
		} {
			if terminal.CanTransitionTo(next) {
				t.Errorf("a %s project was allowed to become %s", terminal, next)
			}
		}
	}
}

func TestProjectCannotSkipTheLifecycle(t *testing.T) {
	// A draft becoming 'completed' in one move would mean a project that was
	// never published, never bid on and never worked, but counts as delivered.
	if ProjectDraft.CanTransitionTo(ProjectCompleted) {
		t.Error("a draft project was allowed to jump straight to completed")
	}
	if ProjectDraft.CanTransitionTo(ProjectHired) {
		t.Error("a draft project was allowed to jump straight to hired")
	}
	if ProjectDraft.CanTransitionTo(ProjectActive) {
		t.Error("a draft project was allowed to jump straight to active")
	}
	// The legal path, one step at a time.
	if !ProjectDraft.CanTransitionTo(ProjectPublished) {
		t.Error("a draft project could not be published")
	}
	if !ProjectPublished.CanTransitionTo(ProjectAcceptingProposals) {
		t.Error("a published project could not start accepting proposals")
	}
	if !ProjectAcceptingProposals.CanTransitionTo(ProjectHired) {
		t.Error("a project accepting proposals could not be hired")
	}
}

func TestTransitionToSelfIsAllowed(t *testing.T) {
	// An idempotent write is not a violation: a client re-sending the state a
	// project is already in should not get a 409.
	for _, status := range []ProjectStatus{ProjectDraft, ProjectCompleted, ProjectCancelled} {
		if !status.CanTransitionTo(status) {
			t.Errorf("%s could not transition to itself", status)
		}
	}
}

func TestProposalTerminalStatesAreTerminal(t *testing.T) {
	for _, terminal := range []ProposalStatus{ProposalAccepted, ProposalRejected, ProposalWithdrawn} {
		if !terminal.IsTerminal() {
			t.Errorf("%s does not report itself terminal", terminal)
		}
		if terminal.IsOpen() {
			t.Errorf("%s reports itself still open", terminal)
		}
		if terminal.CanTransitionTo(ProposalSubmitted) {
			t.Errorf("a %s proposal was allowed to go back to submitted", terminal)
		}
	}
	// An accepted proposal is the basis of a contract; re-accepting it or
	// rejecting it afterwards would contradict a signed agreement.
	if ProposalAccepted.CanTransitionTo(ProposalRejected) {
		t.Error("an accepted proposal was allowed to become rejected")
	}
}

func TestProposalIsOpenCoversExactlyTheAcceptableStates(t *testing.T) {
	// IsOpen decides whether a client may accept a bid, and AcceptProposalTx's
	// guarded UPDATE lists the same three states in SQL. If these drift, the
	// service and the database disagree about what is acceptable.
	open := map[ProposalStatus]bool{
		ProposalSubmitted: true, ProposalViewed: true, ProposalShortlisted: true,
	}
	for _, status := range []ProposalStatus{
		ProposalDraft, ProposalSubmitted, ProposalViewed, ProposalShortlisted,
		ProposalAccepted, ProposalRejected, ProposalWithdrawn,
	} {
		if status.IsOpen() != open[status] {
			t.Errorf("%s.IsOpen() = %v, want %v", status, status.IsOpen(), open[status])
		}
	}
}

func TestContractReviewLoopIsALoop(t *testing.T) {
	// A client may ask for changes more than once, so submitted and
	// revision_requested have to reach each other repeatedly.
	if !ContractSubmitted.CanTransitionTo(ContractRevisionRequested) {
		t.Error("submitted work could not be sent back for revision")
	}
	if !ContractRevisionRequested.CanTransitionTo(ContractSubmitted) {
		t.Error("revised work could not be resubmitted")
	}
	if !ContractRevisionRequested.CanTransitionTo(ContractInProgress) {
		t.Error("a revision request could not return the contract to in progress")
	}
}

func TestContractDisputeIsReachableFromEveryLiveState(t *testing.T) {
	// A dispute that cannot be raised is the failure mode that matters most
	// here: it would leave a party with money at stake and no route to
	// challenge it.
	for _, live := range []ContractStatus{
		ContractActive, ContractInProgress, ContractSubmitted, ContractRevisionRequested,
	} {
		if !live.IsLive() {
			t.Errorf("%s does not report itself live", live)
		}
		if !live.CanTransitionTo(ContractDisputed) {
			t.Errorf("a %s contract could not be disputed", live)
		}
	}
	for _, terminal := range []ContractStatus{ContractCompleted, ContractCancelled} {
		if terminal.IsLive() {
			t.Errorf("%s reports itself live", terminal)
		}
		if terminal.CanTransitionTo(ContractDisputed) {
			t.Errorf("a %s contract was allowed to be disputed", terminal)
		}
	}
}

func TestDisputeOpenStatesMatchTheUniqueIndex(t *testing.T) {
	// uq_freelance_disputes_open_per_contract in migration 0102 lists exactly
	// these four states. If IsOpen and that index disagree, the service will
	// permit a second dispute the database then refuses, or refuse one the
	// database would have allowed.
	open := map[DisputeStatus]bool{
		DisputeOpen: true, DisputeUnderReview: true,
		DisputeAwaitingEvidence: true, DisputeEscalated: true,
	}
	for _, status := range []DisputeStatus{
		DisputeOpen, DisputeUnderReview, DisputeAwaitingEvidence,
		DisputeResolved, DisputeWithdrawn, DisputeEscalated,
	} {
		if status.IsOpen() != open[status] {
			t.Errorf("%s.IsOpen() = %v, want %v", status, status.IsOpen(), open[status])
		}
	}
}

func TestProjectVisibilityHidesDrafts(t *testing.T) {
	// A draft is the client's own working copy. The public board must not
	// carry it, which is the whole reason draft exists as a state.
	if ProjectDraft.IsPubliclyVisible() {
		t.Error("a draft project reports itself publicly visible")
	}
	for _, status := range []ProjectStatus{
		ProjectPublished, ProjectAcceptingProposals, ProjectHired,
		ProjectActive, ProjectCompleted, ProjectCancelled, ProjectDisputed,
	} {
		if !status.IsPubliclyVisible() {
			t.Errorf("%s reports itself not publicly visible", status)
		}
	}
}

func TestOnlyAcceptingProposalsTakesBids(t *testing.T) {
	for _, status := range []ProjectStatus{
		ProjectDraft, ProjectPublished, ProjectHired, ProjectActive,
		ProjectCompleted, ProjectCancelled, ProjectDisputed,
	} {
		if status.AcceptsProposals() {
			t.Errorf("a %s project reported that it accepts proposals", status)
		}
	}
	if !ProjectAcceptingProposals.AcceptsProposals() {
		t.Error("a project accepting proposals reported that it does not")
	}
}

func TestPermissionVocabularyIsSplitCorrectly(t *testing.T) {
	// The administrative half is exactly two codes, and they are the only two
	// seeded into admin_permissions by migration 0102. A per-account code
	// leaking into that list would mean an administrator could be granted
	// "manage somebody's own profile", which is not a thing the product does.
	admin := AdminPermissions()
	if len(admin) != 2 {
		t.Fatalf("AdminPermissions() has %d codes, want 2: %v", len(admin), admin)
	}
	for _, code := range admin {
		if !IsAdminPermission(code) {
			t.Errorf("%s is in AdminPermissions() but IsAdminPermission says otherwise", code)
		}
	}
	for _, code := range AccountPermissions() {
		if IsAdminPermission(code) {
			t.Errorf("per-account permission %s is classified as administrative", code)
		}
		if !IsKnownPermission(code) {
			t.Errorf("%s is in AccountPermissions() but IsKnownPermission says otherwise", code)
		}
	}
	if IsKnownPermission("freelance.not.a.permission") {
		t.Error("an invented permission code was reported as known")
	}
	if want := len(AccountPermissions()) + 2; len(AllPermissions()) != want {
		t.Errorf("AllPermissions() has %d codes, want %d", len(AllPermissions()), want)
	}
}
