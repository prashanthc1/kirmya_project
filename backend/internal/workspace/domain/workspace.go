// Package domain holds the workspace vocabulary: the kinds of workspace a
// Kirmya account can enter, and the shape of one entry in that list.
//
// A workspace is a statement about navigation, never a grant. The list says
// "these surfaces are worth showing this account"; every request those surfaces
// make is authorized independently by the domain that owns the data. Nothing in
// this package may be consulted to authorize anything.
package domain

import (
	"errors"
	"fmt"
	"strings"
)

// ErrAccountNotEligible reports that the account exists but may not enter any
// workspace, because the account itself is not active. Distinct from a lookup
// failure: this is a definite answer, and the answer is "none".
//
// It lives in the domain rather than the service so that a caller which needs
// to tell this apart from an outage - the bootstrap API, which degrades on one
// and not the other - can do so without importing the resolver's package.
var ErrAccountNotEligible = errors.New("account is not eligible for any workspace")

// Type is a kind of workspace.
type Type string

const (
	// TypeProfessional is the personal surface every active account has. It is
	// the default and the fallback.
	TypeProfessional Type = "professional"
	// TypeFreelancer is the personal freelancing surface.
	TypeFreelancer Type = "freelancer"
	// TypeRecruiting is the standalone personal recruiting surface. It is not
	// company-scoped recruiting, which is a company workspace.
	TypeRecruiting Type = "recruiting"
	// TypeCompany is one company the account may manage. Entity-scoped.
	TypeCompany Type = "company"
	// TypeCommunityAdmin is one community the account may administer or
	// moderate. Entity-scoped.
	TypeCommunityAdmin Type = "community_admin"
	// TypePlatformAdmin is Kirmya platform administration.
	TypePlatformAdmin Type = "platform_admin"

	// There is deliberately no page-admin type. Pages have no table, module,
	// route or API, so a page-admin workspace could only ever be a promise the
	// product cannot keep. Adding the constant for "contract stability" would
	// put a value in the vocabulary that the resolver can never return, and a
	// type nobody can be in is worse than a type that does not exist yet.
)

// order fixes the sequence workspaces are returned in. It is here rather than
// in the resolver so that adding a type forces a decision about where it sits.
var order = map[Type]int{
	TypeProfessional:   0,
	TypeFreelancer:     1,
	TypeRecruiting:     2,
	TypeCompany:        3,
	TypeCommunityAdmin: 4,
	TypePlatformAdmin:  5,
}

// Rank returns the sort position of a type. Unknown types sort last rather than
// first, so a mistake cannot displace Professional.
func (t Type) Rank() int {
	if rank, ok := order[t]; ok {
		return rank
	}
	return len(order)
}

// IsEntityScoped reports whether this type requires an entity id to be
// meaningful. A company workspace without one names no company.
func (t Type) IsEntityScoped() bool {
	return t == TypeCompany || t == TypeCommunityAdmin
}

// Workspace is one entry in an account's workspace list.
//
// It carries what a navigation surface needs and nothing else. In particular it
// carries no permission set: shipping permissions to the client invites the
// client to make decisions with them, and those decisions belong on the server.
type Workspace struct {
	// Key is the stable identity of this workspace, unique within one list.
	// The frontend uses it to tell two entries apart and to remember a
	// selection; labels are display text and change, so they are never identity.
	Key string `json:"key"`
	// Type is the kind of workspace.
	Type Type `json:"type"`
	// EntityID names the company or community for entity-scoped types, and is
	// nil for the personal ones.
	EntityID *string `json:"entityId,omitempty"`
	// Label is human-readable display text.
	Label string `json:"label"`
	// Slug is the routing handle where the entity has one. Communities are
	// routed by id and carry none.
	Slug string `json:"slug,omitempty"`
	// Route is where entering this workspace lands.
	Route string `json:"route"`
	// IsDefault marks the workspace to open when none was chosen. Exactly one
	// entry in a list has it, and it is always Professional.
	IsDefault bool `json:"isDefault"`
}

// KeyFor builds the stable identity for a workspace.
//
// Entity-scoped types are keyed by their entity id, which is a uuid, so two
// companies can never collide and a company can never collide with a community.
// The separator is ":" and ids contain none, so the encoding is unambiguous.
func KeyFor(t Type, entityID string) string {
	if !t.IsEntityScoped() {
		return string(t)
	}
	return fmt.Sprintf("%s:%s", t, entityID)
}

// SafeLabel picks display text that is never blank and never an internal id.
//
// Entity names are user-supplied and rows outlive edits, so a company can be
// stored with an empty name and a community with whitespace for a title. The
// fallback is the type's generic noun rather than the uuid: showing a raw id in
// a navigation menu is worse than showing "Company", and it leaks a key the
// label was not meant to carry.
func SafeLabel(name, fallback string) string {
	if trimmed := strings.TrimSpace(name); trimmed != "" {
		return trimmed
	}
	return fallback
}
