package repository

import (
	"os"
	"regexp"
	"strings"
	"testing"
)

// A ratchet on self-asserted verification.
//
// The recruiter module used to stamp two claims onto profiles nothing had
// verified: verification_status "Verified" on the organization profile, and
// verified = true on the recruiter profile. Both were written by the
// auto-provisioning path, so an account that merely loaded a recruiter page
// came away holding a profile that said it had been checked.
//
// This does not ban the word. A real verification transition may set it, and
// should. What it bans is the default: a literal assignment in the code that
// creates a profile, where nothing has decided anything.
func TestProfileCreationNeverAssertsVerification(t *testing.T) {
	source, err := os.ReadFile("recruiter_repo.go")
	if err != nil {
		t.Fatal(err)
	}
	text := withoutComments(string(source))

	if regexp.MustCompile(`VerificationStatus:\s*"Verified"`).MatchString(text) {
		t.Error(`recruiter_repo.go assigns VerificationStatus: "Verified" as a struct default; ` +
			`a created profile has not been verified by anyone`)
	}

	// The INSERT that creates recruiter_profiles must not hardcode verified true
	// or a capability that is already usable.
	for _, banned := range []string{
		"verified, created_at) VALUES ($1, $2, $3, true",
		"'active', NOW())",
	} {
		if strings.Contains(text, banned) {
			t.Errorf("recruiter_repo.go creates a profile with %q; creation is not activation", banned)
		}
	}

	// The capability a fresh profile gets must be 'pending'.
	if !strings.Contains(text, "'pending'") {
		t.Error("recruiter_repo.go no longer creates profiles in the pending state; " +
			"a newly created recruiter profile must not be usable until onboarding completes")
	}
}

// withoutComments strips comments, so a file that documents which claim it
// stopped making is not accused of making it. This file's own explanation of
// the defect is a comment, and so is the one in recruiter_repo.go.
func withoutComments(source string) string {
	source = regexp.MustCompile(`(?s)/\*.*?\*/`).ReplaceAllString(source, "")
	return regexp.MustCompile(`(?m)^\s*//.*$`).ReplaceAllString(source, "")
}
