package domain

import "errors"

// The refusals the service layer returns and the handlers map onto status codes.
//
// These follow internal/company/domain/states.go, including the reason
// ErrNotFound doubles as "you may not know this exists": answering 404 for a row
// the caller has no right to see means walking IDs reveals nothing about which
// ones are real. A 403 on somebody else's project would confirm the project.
var (
	// ErrNotFound is also returned when the caller has no right to know the
	// resource exists.
	ErrNotFound = errors.New("freelance: resource not found")
	// ErrForbidden means the caller is authenticated and the resource exists,
	// but this account is not the owner or a party to it.
	ErrForbidden = errors.New("freelance: permission denied")
	// ErrUnauthenticated means no user is attached to the request.
	ErrUnauthenticated = errors.New("freelance: authentication required")
	// ErrConflict covers a duplicate proposal, a second open dispute on one
	// contract, and a second review by the same author.
	ErrConflict = errors.New("freelance: conflicting state")
	// ErrValidation covers input that binding could not catch: a bad enum, an
	// out-of-range amount, milestones that do not sum to the bid.
	ErrValidation = errors.New("freelance: invalid input")
	// ErrIllegalTransition means the move is between two real states that the
	// lifecycle does not connect - completing a cancelled contract, say.
	ErrIllegalTransition = errors.New("freelance: illegal state transition")
)

// TransitionError names both ends of a refused move, so the caller is told what
// it asked for rather than just that it was wrong.
type TransitionError struct {
	Entity string
	From   string
	To     string
}

func (e *TransitionError) Error() string {
	return "freelance: a " + e.Entity + " cannot move from " + e.From + " to " + e.To
}

func (e *TransitionError) Unwrap() error { return ErrIllegalTransition }

// ValidationError names the field that failed and why.
//
// Typed rather than a formatted string so a handler can return the field name
// to the client and a test can assert on it without matching prose.
type ValidationError struct {
	Field  string
	Reason string
}

func (e *ValidationError) Error() string {
	return "freelance: " + e.Field + " " + e.Reason
}

func (e *ValidationError) Unwrap() error { return ErrValidation }

// NewValidationError is the constructor the service layer uses.
func NewValidationError(field, reason string) *ValidationError {
	return &ValidationError{Field: field, Reason: reason}
}
