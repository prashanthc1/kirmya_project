package domain

// The module's audit actions and domain events.
//
// Two separate vocabularies, because they answer different questions and go to
// different places.
//
// # Audit actions
//
// "Who did this, to what, and when." Written through the repository's existing
// telemetry stream (internal/shared/telemetry.LogUserAction), which is where the
// freelancer capability transitions already go - so a capability can be traced
// from first refusal to grant to suspension without joining two systems. There
// is deliberately no second audit system here.
//
// No audit entry carries a rate, a bid, a cover letter or a contract's terms.
// The audit question is who changed whose standing; the commercial detail is in
// the row itself and does not need copying into a log that is retained longer.
const (
	AuditProfileCreated   = "FREELANCE_PROFILE_CREATED"
	AuditProfileUpdated   = "FREELANCE_PROFILE_UPDATED"
	AuditProfileEnabled   = "FREELANCER_CAPABILITY_GRANTED"
	AuditProfileSuspended = "FREELANCER_CAPABILITY_SUSPENDED"
	AuditProfileReinstate = "FREELANCER_CAPABILITY_REINSTATED"

	AuditProjectCreated     = "FREELANCE_PROJECT_CREATED"
	AuditProjectUpdated     = "FREELANCE_PROJECT_UPDATED"
	AuditProjectPublished   = "FREELANCE_PROJECT_PUBLISHED"
	AuditProjectUnpublished = "FREELANCE_PROJECT_UNPUBLISHED"

	AuditProposalSubmitted = "FREELANCE_PROPOSAL_SUBMITTED"
	AuditProposalWithdrawn = "FREELANCE_PROPOSAL_WITHDRAWN"
	AuditProposalAccepted  = "FREELANCE_PROPOSAL_ACCEPTED"

	AuditContractCreated   = "FREELANCE_CONTRACT_CREATED"
	AuditContractCompleted = "FREELANCE_CONTRACT_COMPLETED"

	AuditDisputeOpened   = "FREELANCE_DISPUTE_OPENED"
	AuditDisputeDecided  = "FREELANCE_DISPUTE_DECIDED"
	AuditAdminActionTook = "FREELANCE_ADMIN_ACTION"
)

// Domain events, published on the repository's existing in-process bus
// (internal/shared/events). These are how other modules learn that something
// happened in the marketplace without reading its tables.
//
// The naming follows the bus's existing convention - 'user.registered',
// 'job.applied' - so a subscriber filtering on a prefix sees the whole module.
//
// Each payload carries identifiers only. A subscriber that needs the project's
// budget asks the freelance module for the project; it does not get a copy in
// the event that can be stale by the time it is handled, and it does not reach
// into freelance_projects itself. That is the integration boundary: events and
// service interfaces, never another module's tables.
const (
	EventProfileEnabled   = "freelance.profile.enabled"
	EventProfileDisabled  = "freelance.profile.disabled"
	EventProfileUpdated   = "freelance.profile.updated"
	EventProjectPublished = "freelance.project.published"
	EventProjectCancelled = "freelance.project.cancelled"
	EventProposalSubmited = "freelance.proposal.submitted"
	EventProposalAccepted = "freelance.proposal.accepted"
	EventContractCreated  = "freelance.contract.created"
	EventContractComplete = "freelance.contract.completed"
	EventDisputeOpened    = "freelance.dispute.opened"
)

// AllEventTypes is every event this module can publish.
//
// Exported so a subscriber can register for the whole module, and so a test can
// assert that the set does not change silently - an event another module has
// come to depend on is part of this module's contract, not an implementation
// detail.
func AllEventTypes() []string {
	return []string{
		EventProfileEnabled,
		EventProfileDisabled,
		EventProfileUpdated,
		EventProjectPublished,
		EventProjectCancelled,
		EventProposalSubmited,
		EventProposalAccepted,
		EventContractCreated,
		EventContractComplete,
		EventDisputeOpened,
	}
}
