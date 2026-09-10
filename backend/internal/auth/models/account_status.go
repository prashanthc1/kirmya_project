package models

import "strings"

// Account standing, and the one rule that decides whether an account may
// authenticate.
//
// Before this existed the question was answered three different ways in the
// same file. Login refused a denylist of "locked", "suspended" and "disabled";
// refresh required an allowlist of exactly "active"; password reset refused a
// third, longer denylist. So an account marked "deleted" was refused by refresh
// and admitted by login - it signed in, was issued an access token and a
// refresh session, and read ordinary protected APIs until that token expired.
// Any status nobody had thought of, including a typo, was admitted the same way.
//
// The direction of the mistake is what matters: a denylist admits everything it
// has not been told to refuse, so every status added later is authenticatable
// by default, silently, until somebody remembers to add it. An allowlist
// refuses everything it has not been told to admit. Account standing is not a
// place to be generous with the defaults.

// Status is the standing of an account, as stored in users.status.
//
// The column is a VARCHAR with no CHECK constraint, so the database itself
// permits any string; these are the values the product actually uses. In the CI
// database only "active" and "deleted" occur.
type Status string

const (
	// StatusActive is the only status that may authenticate.
	StatusActive Status = "active"

	// StatusSuspended is an account withdrawn by an administrator.
	StatusSuspended Status = "suspended"
	// StatusDisabled is an account turned off, typically in response to abuse.
	StatusDisabled Status = "disabled"
	// StatusLocked is an account locked, historically after repeated failures.
	StatusLocked Status = "locked"
	// StatusDeleted is an account erased under the data-deletion path, which
	// anonymises the row rather than removing it.
	StatusDeleted Status = "deleted"

	// There is deliberately no "banned" user status. The word appears in the
	// codebase as a *community membership* status, and it leaked from there
	// into the password-reset denylist, where it matched nothing: no code path
	// has ever written it to users.status. Listing it here would suggest the
	// product has a concept it does not.
)

// KnownStatuses is every status the product writes or recognises.
//
// Used to validate an administrative status change, so a typo cannot invent a
// standing nothing understands. It is not the authentication rule - being known
// and being able to sign in are different questions, and only one status
// answers yes to the second.
func KnownStatuses() []Status {
	return []Status{StatusActive, StatusSuspended, StatusDisabled, StatusLocked, StatusDeleted}
}

// NormalizeStatus trims and lowercases a stored status.
//
// The column is free text and the administrative endpoint writes whatever it is
// given, so " Active" and "ACTIVE" are both reachable. Normalising means an
// account is not locked out by the case somebody typed; it does not widen the
// rule, because only one value is admitted whatever its case.
func NormalizeStatus(status string) Status {
	return Status(strings.ToLower(strings.TrimSpace(status)))
}

// IsKnown reports whether a status is one the product recognises.
func (s Status) IsKnown() bool {
	for _, known := range KnownStatuses() {
		if s == known {
			return true
		}
	}
	return false
}

// CanAuthenticate reports whether an account in this standing may sign in,
// refresh a session, or restore one.
//
// An allowlist of exactly one value. Every other status - known, unknown, empty
// or misspelled - answers false.
func (s Status) CanAuthenticate() bool {
	return s == StatusActive
}

// CanAuthenticate reports whether this account may authenticate and use
// ordinary protected Kirmya APIs.
//
// This is the canonical rule. Login, token refresh and session restoration all
// call it, so the three cannot disagree about what an account in a given
// standing may do. It is not a permission check and grants nothing: it is the
// outer gate that every other authorization sits behind, and a "yes" here only
// means the account exists and is in good standing.
func (u *User) CanAuthenticate() bool {
	if u == nil {
		return false
	}
	return NormalizeStatus(u.Status).CanAuthenticate()
}
