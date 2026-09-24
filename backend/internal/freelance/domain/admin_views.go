package domain

import "github.com/google/uuid"

// What the administrative screens show about the people and projects behind a
// dispute or a payout.
//
// The records themselves carry only ids, which is right for them and useless
// to a person working a queue: "contract 3f2a…, raised by user 9c1d…" cannot
// be acted on without a second tool. These views are assembled for
// administrators only - they carry email addresses, which the parties' own
// screens never show about each other.

// PersonRef names an account for an administrator.
type PersonRef struct {
	ID uuid.UUID `json:"id"`
	// Name is the account's first and last name; empty when it has none.
	Name  string `json:"name"`
	Email string `json:"email"`
}

// ContractSummary is who a contract is between, and what it is for.
type ContractSummary struct {
	ID           uuid.UUID `json:"id"`
	ProjectTitle string    `json:"project_title"`
	Client       PersonRef `json:"client"`
	Freelancer   PersonRef `json:"freelancer"`
}

// AdminDispute is a dispute in the administrator's queue.
type AdminDispute struct {
	Dispute
	// Contract is absent only if the contract no longer exists.
	Contract       *ContractSummary `json:"contract,omitempty"`
	RaisedByPerson *PersonRef       `json:"raised_by_person,omitempty"`
}

// AdminDisputeDetail is one dispute, with its milestone, evidence, and the
// people involved. Evidence names its author by id; the author is always the
// client or the freelancer on Contract.
type AdminDisputeDetail struct {
	DisputeDetail
	Contract       *ContractSummary `json:"contract,omitempty"`
	RaisedByPerson *PersonRef       `json:"raised_by_person,omitempty"`
}
