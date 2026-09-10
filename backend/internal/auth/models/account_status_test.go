package models

import "testing"

/*
The canonical account-eligibility rule.

One property carries the whole fix: the rule is an allowlist. Everything else
here is a consequence of that, and the consequence that matters is the last
test - a status nobody has thought of is refused rather than admitted.
*/

func TestOnlyActiveMayAuthenticate(t *testing.T) {
	if !(&User{Status: "active"}).CanAuthenticate() {
		t.Error("an active account cannot authenticate")
	}
	for _, status := range []Status{StatusSuspended, StatusDisabled, StatusLocked, StatusDeleted} {
		if (&User{Status: string(status)}).CanAuthenticate() {
			t.Errorf("%q can authenticate", status)
		}
	}
}

// The bug this replaces: login refused a denylist, so "deleted" - which nothing
// on that list named - signed in.
func TestDeletedCannotAuthenticate(t *testing.T) {
	if (&User{Status: "deleted"}).CanAuthenticate() {
		t.Error("a deleted account can authenticate; this is the defect the allowlist exists to prevent")
	}
}

// The reason for an allowlist, stated as a test: a status the code has never
// heard of must be refused, not admitted. Under the previous denylists every
// one of these signed in.
func TestUnknownStatusesAreRefused(t *testing.T) {
	for _, status := range []string{
		"", " ", "banned", "blocked", "deactivated", "inactive", "pending",
		"archived", "frozen", "under_review", "actve", "not-a-status",
	} {
		if (&User{Status: status}).CanAuthenticate() {
			t.Errorf("unknown status %q can authenticate", status)
		}
	}
}

// Case and surrounding space come from a free-text column an administrative
// endpoint writes. Normalising avoids locking an account out over the shape of
// the word, and cannot widen the rule beyond the single value it admits.
func TestStatusIsNormalisedBeforeComparison(t *testing.T) {
	for _, status := range []string{"active", "ACTIVE", "Active", "  active  ", "\tActive\n"} {
		if !(&User{Status: status}).CanAuthenticate() {
			t.Errorf("%q cannot authenticate; normalisation failed", status)
		}
	}
	// And normalisation does not smuggle anything else in.
	for _, status := range []string{"  deleted ", "DELETED", "Suspended"} {
		if (&User{Status: status}).CanAuthenticate() {
			t.Errorf("%q can authenticate after normalisation", status)
		}
	}
}

func TestNilUserCannotAuthenticate(t *testing.T) {
	var u *User
	if u.CanAuthenticate() {
		t.Error("a nil user can authenticate")
	}
}

// Being known and being able to sign in are different questions.
func TestKnownStatusesAreNotAllAuthenticatable(t *testing.T) {
	authenticatable := 0
	for _, status := range KnownStatuses() {
		if !status.IsKnown() {
			t.Errorf("%q is in KnownStatuses and reports itself unknown", status)
		}
		if status.CanAuthenticate() {
			authenticatable++
		}
	}
	if authenticatable != 1 {
		t.Errorf("%d known statuses may authenticate, want exactly 1 (active)", authenticatable)
	}
	if NormalizeStatus("banned").IsKnown() {
		t.Error("\"banned\" is a community membership status and is not a user status")
	}
}
