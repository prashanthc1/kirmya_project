package domain

// Disputes and refunds: what happens to escrowed money when the parties do not
// agree, or agree to part.
//
// A dispute is raised on one milestone whose money is held in escrow. While it
// is open the milestone is frozen - nobody can submit, approve, revise or
// refund it - and a Kirmya administrator decides it with one of three outcomes.
// The raiser may withdraw it instead, which returns the milestone to exactly
// where it was.
//
// Outside a dispute, only the freelancer can refund a funded milestone: it is
// their payment to give up. A client who wants their money back and does not
// have the freelancer's agreement raises a dispute.

// DisputeReason is why a dispute was raised. A closed list rather than free
// text, so an administrator's queue can be triaged by it; the detail field
// carries the account in the raiser's own words.
type DisputeReason string

const (
	ReasonWorkNotDelivered DisputeReason = "work_not_delivered"
	ReasonQuality          DisputeReason = "quality"
	ReasonScope            DisputeReason = "scope"
	ReasonUnresponsive     DisputeReason = "unresponsive"
	ReasonOther            DisputeReason = "other"
)

// ParseDisputeReason rejects unknown values.
func ParseDisputeReason(value string) (DisputeReason, bool) {
	switch DisputeReason(normalize(value)) {
	case ReasonWorkNotDelivered:
		return ReasonWorkNotDelivered, true
	case ReasonQuality:
		return ReasonQuality, true
	case ReasonScope:
		return ReasonScope, true
	case ReasonUnresponsive:
		return ReasonUnresponsive, true
	case ReasonOther:
		return ReasonOther, true
	}
	return "", false
}

// DisputeOutcome is an administrator's decision.
type DisputeOutcome string

const (
	// OutcomeReleaseToFreelancer: the escrowed money goes to the freelancer, as
	// if the client had approved the work.
	OutcomeReleaseToFreelancer DisputeOutcome = "release_to_freelancer"
	// OutcomeRefundToClient: the escrowed money goes back to the client and the
	// milestone is cancelled.
	OutcomeRefundToClient DisputeOutcome = "refund_to_client"
	// OutcomeResumeWork: no money moves. The milestone goes back to in_progress
	// with its money still in escrow, and the freelancer carries on.
	OutcomeResumeWork DisputeOutcome = "resume_work"
)

// ParseDisputeOutcome rejects unknown values.
func ParseDisputeOutcome(value string) (DisputeOutcome, bool) {
	switch DisputeOutcome(normalize(value)) {
	case OutcomeReleaseToFreelancer:
		return OutcomeReleaseToFreelancer, true
	case OutcomeRefundToClient:
		return OutcomeRefundToClient, true
	case OutcomeResumeWork:
		return OutcomeResumeWork, true
	}
	return "", false
}

// EvidenceKind is what an item of evidence is.
type EvidenceKind string

const (
	EvidenceNote EvidenceKind = "note"
	EvidenceLink EvidenceKind = "link"
	EvidenceFile EvidenceKind = "file"
)

// ParseEvidenceKind accepts the kinds a party can submit. The schema also
// allows message_reference, which nothing produces yet.
func ParseEvidenceKind(value string) (EvidenceKind, bool) {
	switch EvidenceKind(normalize(value)) {
	case EvidenceNote, "":
		return EvidenceNote, true
	case EvidenceLink:
		return EvidenceLink, true
	case EvidenceFile:
		return EvidenceFile, true
	}
	return "", false
}

// OpenDisputePayload raises a dispute on a milestone.
type OpenDisputePayload struct {
	Reason string `json:"reason" binding:"required"`
	Detail string `json:"detail" binding:"required"`
}

// AddEvidencePayload adds one item to an open dispute.
type AddEvidencePayload struct {
	Kind    string `json:"kind"`
	Body    string `json:"body"`
	FileURL string `json:"file_url"`
}

// ResolveDisputePayload is an administrator's decision.
type ResolveDisputePayload struct {
	Outcome    string `json:"outcome" binding:"required"`
	Resolution string `json:"resolution" binding:"required"`
}

// RefundMilestonePayload is the freelancer giving a milestone's money back.
type RefundMilestonePayload struct {
	Reason string `json:"reason" binding:"required"`
}

// DisputeDetail is a dispute with the milestone it is about and its evidence.
type DisputeDetail struct {
	Dispute
	Milestone *ContractMilestone `json:"milestone,omitempty"`
	Evidence  []DisputeEvidence  `json:"evidence"`
}
