package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/repository"

	"github.com/google/uuid"
)

// newMemoryService builds the service over the repository's no-database path.
//
// It is the real repository, not a stub, so the lifecycle rules under test are
// the ones the product runs rather than a second implementation written to
// agree with the test.
func newMemoryService(t *testing.T) (FreelanceService, uuid.UUID) {
	t.Helper()
	return NewFreelanceService(repository.NewFreelanceRepository(nil)), uuid.New()
}

func completeDraft() domain.SaveProfilePayload {
	return domain.SaveProfilePayload{
		HourlyRate: 90,
		Tagline:    "Backend engineer",
		Skills:     []string{"Go"},
	}
}

// An account that has done nothing holds nothing. Asking the question must not
// answer it into existence.
func TestOrdinaryAccountHoldsNoCapability(t *testing.T) {
	svc, userID := newMemoryService(t)

	capability, err := svc.FreelancerCapability(context.Background(), userID)
	if err != nil {
		t.Fatalf("capability: %v", err)
	}
	if capability != CapabilityNone {
		t.Errorf("capability = %q, want %q", capability, CapabilityNone)
	}

	// And the profile read says so rather than inventing one.
	if _, err := svc.GetProfileByUserID(context.Background(), userID); !errors.Is(err, ErrProfileNotFound) {
		t.Errorf("GetProfileByUserID for a non-freelancer returned %v, want ErrProfileNotFound", err)
	}
}

// Saving a draft starts onboarding. It must not finish it: this is the step
// that used to be the whole of becoming a freelancer.
func TestSavingADraftDoesNotGrantCapability(t *testing.T) {
	svc, userID := newMemoryService(t)

	if _, err := svc.SaveProfile(context.Background(), userID, completeDraft()); err != nil {
		t.Fatalf("save profile: %v", err)
	}

	capability, err := svc.FreelancerCapability(context.Background(), userID)
	if err != nil {
		t.Fatalf("capability: %v", err)
	}
	if capability != CapabilityPending {
		t.Errorf("capability after saving a draft = %q, want %q", capability, CapabilityPending)
	}
}

// An empty payload was enough to acquire the Freelancer workspace, permanently.
// Now it produces a pending profile that cannot complete.
func TestEmptyDraftCannotCompleteOnboarding(t *testing.T) {
	svc, userID := newMemoryService(t)

	if _, err := svc.SaveProfile(context.Background(), userID, domain.SaveProfilePayload{}); err != nil {
		t.Fatalf("save empty profile: %v", err)
	}

	_, err := svc.CompleteOnboarding(context.Background(), userID)
	var incomplete *IncompleteOnboardingError
	if !errors.As(err, &incomplete) {
		t.Fatalf("CompleteOnboarding on an empty draft returned %v, want IncompleteOnboardingError", err)
	}
	for _, field := range []string{"hourly_rate", "tagline", "skills"} {
		if !contains(incomplete.Missing, field) {
			t.Errorf("missing fields %v do not include %q", incomplete.Missing, field)
		}
	}

	capability, _ := svc.FreelancerCapability(context.Background(), userID)
	if capability == CapabilityActive {
		t.Error("a refused onboarding activated the capability anyway")
	}
}

// Completing onboarding is the one transition that grants it.
func TestCompletingOnboardingGrantsCapability(t *testing.T) {
	svc, userID := newMemoryService(t)

	if _, err := svc.SaveProfile(context.Background(), userID, completeDraft()); err != nil {
		t.Fatalf("save profile: %v", err)
	}
	if _, err := svc.CompleteOnboarding(context.Background(), userID); err != nil {
		t.Fatalf("complete onboarding: %v", err)
	}

	capability, err := svc.FreelancerCapability(context.Background(), userID)
	if err != nil {
		t.Fatalf("capability: %v", err)
	}
	if capability != CapabilityActive {
		t.Errorf("capability after completing onboarding = %q, want %q", capability, CapabilityActive)
	}

	// Idempotent: a client retrying a completed step is not told it failed.
	if _, err := svc.CompleteOnboarding(context.Background(), userID); err != nil {
		t.Errorf("repeating a completed onboarding returned %v, want nil", err)
	}
}

// Completing onboarding does not create the profile, so it is not a second way
// to provision a freelancer.
func TestCompletingOnboardingWithoutADraftIsRefused(t *testing.T) {
	svc, userID := newMemoryService(t)

	if _, err := svc.CompleteOnboarding(context.Background(), userID); !errors.Is(err, ErrNotAFreelancer) {
		t.Fatalf("CompleteOnboarding with no draft returned %v, want ErrNotAFreelancer", err)
	}
	capability, _ := svc.FreelancerCapability(context.Background(), userID)
	if capability != CapabilityNone {
		t.Errorf("a refused completion left capability %q, want %q", capability, CapabilityNone)
	}
}

// Suspension is the point of the whole lifecycle: it stops freelancing without
// touching anything else, and it preserves the profile.
func TestSuspensionDeniesAndPreserves(t *testing.T) {
	svc, userID := newMemoryService(t)
	adminID := uuid.New()

	if _, err := svc.SaveProfile(context.Background(), userID, completeDraft()); err != nil {
		t.Fatalf("save profile: %v", err)
	}
	if _, err := svc.CompleteOnboarding(context.Background(), userID); err != nil {
		t.Fatalf("complete onboarding: %v", err)
	}

	if err := svc.SuspendCapability(context.Background(), adminID, userID, "CI suspension test"); err != nil {
		t.Fatalf("suspend: %v", err)
	}
	capability, _ := svc.FreelancerCapability(context.Background(), userID)
	if capability != CapabilitySuspended {
		t.Fatalf("capability after suspension = %q, want %q", capability, CapabilitySuspended)
	}

	// The profile and everything on it survive.
	prof, err := svc.GetProfileByUserID(context.Background(), userID)
	if err != nil {
		t.Fatalf("a suspended freelancer's profile was not readable: %v", err)
	}
	if prof.Tagline != "Backend engineer" || len(prof.Skills) != 1 {
		t.Errorf("suspension altered the profile: %+v", prof)
	}

	// New commercial activity is refused.
	if _, err := svc.SubmitProposal(context.Background(), userID, uuid.New(), domain.SubmitProposalPayload{
		BidAmount: 100, EstimatedDays: 2, CoverLetter: "hello",
	}); !errors.Is(err, ErrFreelancerNotActive) {
		t.Errorf("a suspended freelancer submitted a proposal: %v", err)
	}

	// And onboarding is not a way back in.
	if _, err := svc.SaveProfile(context.Background(), userID, completeDraft()); !errors.Is(err, ErrFreelancerSuspended) {
		t.Errorf("a suspended freelancer edited their listing: %v", err)
	}
	if _, err := svc.CompleteOnboarding(context.Background(), userID); !errors.Is(err, ErrFreelancerSuspended) {
		t.Errorf("a suspended freelancer re-onboarded their way back in: %v", err)
	}
}

// Reinstatement returns the same identity, not a second one.
func TestReinstatementRestoresTheSameIdentity(t *testing.T) {
	svc, userID := newMemoryService(t)
	adminID := uuid.New()

	if _, err := svc.SaveProfile(context.Background(), userID, completeDraft()); err != nil {
		t.Fatalf("save profile: %v", err)
	}
	if _, err := svc.CompleteOnboarding(context.Background(), userID); err != nil {
		t.Fatalf("complete onboarding: %v", err)
	}
	before, err := svc.GetProfileByUserID(context.Background(), userID)
	if err != nil {
		t.Fatalf("read profile: %v", err)
	}

	if err := svc.SuspendCapability(context.Background(), adminID, userID, "CI"); err != nil {
		t.Fatalf("suspend: %v", err)
	}
	if err := svc.ReinstateCapability(context.Background(), adminID, userID, "CI"); err != nil {
		t.Fatalf("reinstate: %v", err)
	}

	capability, _ := svc.FreelancerCapability(context.Background(), userID)
	if capability != CapabilityActive {
		t.Errorf("capability after reinstatement = %q, want %q", capability, CapabilityActive)
	}
	after, err := svc.GetProfileByUserID(context.Background(), userID)
	if err != nil {
		t.Fatalf("read profile after reinstatement: %v", err)
	}
	if after.ID != before.ID {
		t.Errorf("reinstatement produced a different freelancer identity: %s then %s", before.ID, after.ID)
	}
}

// An administrator may withdraw freelancing from a freelancer. They may not
// make one out of somebody who never chose to be one.
func TestAdministratorCannotCreateAFreelancer(t *testing.T) {
	svc, userID := newMemoryService(t)

	if err := svc.ReinstateCapability(context.Background(), uuid.New(), userID, "CI"); !errors.Is(err, ErrNotAFreelancer) {
		t.Fatalf("reinstating a non-freelancer returned %v, want ErrNotAFreelancer", err)
	}
	capability, _ := svc.FreelancerCapability(context.Background(), userID)
	if capability != CapabilityNone {
		t.Errorf("an administrative action created capability %q out of nothing", capability)
	}
}

// A standing change with no stated reason is refused: the audit entry is the
// point of the endpoint.
func TestCapabilityChangeRequiresAReason(t *testing.T) {
	svc, userID := newMemoryService(t)
	if _, err := svc.SaveProfile(context.Background(), userID, completeDraft()); err != nil {
		t.Fatalf("save profile: %v", err)
	}
	if _, err := svc.CompleteOnboarding(context.Background(), userID); err != nil {
		t.Fatalf("complete onboarding: %v", err)
	}
	if err := svc.SuspendCapability(context.Background(), uuid.New(), userID, "   "); !errors.Is(err, ErrReasonRequired) {
		t.Errorf("a suspension with a blank reason returned %v, want ErrReasonRequired", err)
	}
}

// OnboardingStatus is a read. It must not provision anybody, which is what lets
// a client ask "can I become a freelancer" without becoming one.
func TestOnboardingStatusCreatesNothing(t *testing.T) {
	svc, userID := newMemoryService(t)

	for i := 0; i < 5; i++ {
		status, err := svc.OnboardingStatus(context.Background(), userID)
		if err != nil {
			t.Fatalf("onboarding status: %v", err)
		}
		if status.Capability != CapabilityNone {
			t.Fatalf("asking for onboarding status produced capability %q", status.Capability)
		}
		if status.Profile != nil {
			t.Fatalf("onboarding status invented a profile: %+v", status.Profile)
		}
		if len(status.Missing) == 0 {
			t.Error("onboarding status did not say what onboarding will need")
		}
	}
}

// The activation rule is one rule, shared with migration 0101's backfill.
func TestRequiredForActivation(t *testing.T) {
	for name, tc := range map[string]struct {
		profile *domain.FreelancerProfile
		want    []string
	}{
		"nil":           {nil, []string{"hourly_rate", "tagline", "skills"}},
		"empty":         {&domain.FreelancerProfile{}, []string{"hourly_rate", "tagline", "skills"}},
		"no skills":     {&domain.FreelancerProfile{HourlyRate: 10, Tagline: "x"}, []string{"skills"}},
		"blank tagline": {&domain.FreelancerProfile{HourlyRate: 10, Tagline: "   ", Skills: []string{"Go"}}, []string{"tagline"}},
		"zero rate":     {&domain.FreelancerProfile{Tagline: "x", Skills: []string{"Go"}}, []string{"hourly_rate"}},
		"complete":      {&domain.FreelancerProfile{HourlyRate: 10, Tagline: "x", Skills: []string{"Go"}}, nil},
	} {
		t.Run(name, func(t *testing.T) {
			got := tc.profile.RequiredForActivation()
			if strings.Join(got, ",") != strings.Join(tc.want, ",") {
				t.Errorf("missing = %v, want %v", got, tc.want)
			}
		})
	}
}

func contains(haystack []string, needle string) bool {
	for _, item := range haystack {
		if item == needle {
			return true
		}
	}
	return false
}
