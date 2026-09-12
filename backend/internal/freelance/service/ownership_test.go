package service

import (
	"context"
	"errors"
	"testing"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/repository"

	"github.com/google/uuid"
)

// Ownership, which is the module's whole defence against IDOR.
//
// Every test here is the same shape: one account creates something, a second
// account asks for it, and the second account must be refused. The refusal has
// to be 404-shaped (domain.ErrNotFound) rather than 403-shaped, because a 403
// confirms the resource exists - and an attacker walking uuids to find out which
// ones are real is the reconnaissance step these endpoints have to deny.
//
// These run against the repository's no-database path, so they are part of the
// fast unit gate and cannot be skipped for want of PostgreSQL.

func twoAccounts(t *testing.T) (FreelanceService, uuid.UUID, uuid.UUID) {
	t.Helper()
	svc := NewFreelanceService(repository.NewFreelanceRepository(nil))
	return svc, uuid.New(), uuid.New()
}

func draftProject() domain.CreateProjectPayload {
	return domain.CreateProjectPayload{
		Title:          "Build a billing reconciliation job",
		Description:    "Nightly reconciliation against the ledger.",
		Budget:         500000, // 5,000.00 AED in fils
		SkillsRequired: []string{"Go", "PostgreSQL"},
	}
}

// A client creating a project owns it, and it starts as a draft rather than
// being published to the whole marketplace by the act of writing it down.
func TestCreatedProjectIsADraftOwnedByItsCreator(t *testing.T) {
	svc, owner, _ := twoAccounts(t)

	proj, err := svc.CreateProject(context.Background(), owner, draftProject())
	if err != nil {
		t.Fatalf("CreateProject: %v", err)
	}
	if proj.Status != domain.ProjectDraft {
		t.Errorf("new project status = %q, want %q", proj.Status, domain.ProjectDraft)
	}
	if proj.ClientID != owner {
		t.Errorf("new project client = %s, want %s", proj.ClientID, owner)
	}
	if proj.Currency != domain.DefaultCurrency {
		t.Errorf("new project currency = %q, want %q", proj.Currency, domain.DefaultCurrency)
	}
	if !proj.OwnedBy(owner) {
		t.Error("the creating account is not reported as the owner")
	}
}

// The client id comes from the session, never from the payload. There is no
// field for it on CreateProjectPayload precisely so that this cannot be
// attempted, and this test pins that: whatever the caller sends, the owner is
// the authenticated account.
func TestProjectOwnerIsTheAuthenticatedCaller(t *testing.T) {
	svc, owner, stranger := twoAccounts(t)

	proj, err := svc.CreateProject(context.Background(), owner, draftProject())
	if err != nil {
		t.Fatalf("CreateProject: %v", err)
	}
	if proj.OwnedBy(stranger) {
		t.Error("a second account was reported as the owner of somebody else's project")
	}
}

// The read. A stranger must not be able to fetch another client's project -
// least of all a draft, which has never been published to anyone.
func TestStrangerCannotReadAnotherClientsProject(t *testing.T) {
	svc, owner, stranger := twoAccounts(t)

	proj, err := svc.CreateProject(context.Background(), owner, draftProject())
	if err != nil {
		t.Fatalf("CreateProject: %v", err)
	}

	if _, err := svc.GetOwnProject(context.Background(), owner, proj.ID); err != nil {
		t.Fatalf("the owner could not read their own project: %v", err)
	}

	_, err = svc.GetOwnProject(context.Background(), stranger, proj.ID)
	if !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("a stranger reading another client's project got %v, want domain.ErrNotFound", err)
	}
	// Specifically not ErrForbidden: that would confirm the project exists.
	if errors.Is(err, domain.ErrForbidden) {
		t.Error("the refusal was 403-shaped, which confirms the resource exists to an attacker walking ids")
	}
}

// The write. This is the one that matters most: a stranger editing somebody
// else's project could retitle it, rewrite its budget, or cancel it.
func TestStrangerCannotEditAnotherClientsProject(t *testing.T) {
	svc, owner, stranger := twoAccounts(t)

	proj, err := svc.CreateProject(context.Background(), owner, draftProject())
	if err != nil {
		t.Fatalf("CreateProject: %v", err)
	}

	hijacked := "Now it says something else"
	_, err = svc.UpdateOwnProject(context.Background(), stranger, proj.ID,
		domain.UpdateProjectPayload{Title: &hijacked})
	if !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("a stranger editing another client's project got %v, want domain.ErrNotFound", err)
	}

	// And the refusal actually prevented the write, rather than merely
	// returning an error after performing it.
	after, err := svc.GetOwnProject(context.Background(), owner, proj.ID)
	if err != nil {
		t.Fatalf("re-reading the project: %v", err)
	}
	if after.Title == hijacked {
		t.Error("the project was modified despite the refusal")
	}
}

// An unauthenticated caller - a nil uuid, which is what a missing session
// produces - reaches nothing.
func TestUnauthenticatedCallerReachesNoProject(t *testing.T) {
	svc, owner, _ := twoAccounts(t)

	proj, err := svc.CreateProject(context.Background(), owner, draftProject())
	if err != nil {
		t.Fatalf("CreateProject: %v", err)
	}

	if _, err := svc.GetOwnProject(context.Background(), uuid.Nil, proj.ID); !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("an unauthenticated read got %v, want domain.ErrUnauthenticated", err)
	}
	if _, err := svc.CreateProject(context.Background(), uuid.Nil, draftProject()); !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("an unauthenticated create got %v, want domain.ErrUnauthenticated", err)
	}
	title := "x"
	if _, err := svc.UpdateOwnProject(context.Background(), uuid.Nil, proj.ID,
		domain.UpdateProjectPayload{Title: &title}); !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("an unauthenticated update got %v, want domain.ErrUnauthenticated", err)
	}
}

// The owner may move their project only along the lifecycle. This is the rule a
// CHECK constraint cannot express.
func TestOwnerCannotSkipTheProjectLifecycle(t *testing.T) {
	svc, owner, _ := twoAccounts(t)

	proj, err := svc.CreateProject(context.Background(), owner, draftProject())
	if err != nil {
		t.Fatalf("CreateProject: %v", err)
	}

	completed := string(domain.ProjectCompleted)
	_, err = svc.UpdateOwnProject(context.Background(), owner, proj.ID,
		domain.UpdateProjectPayload{Status: &completed})
	var transition *domain.TransitionError
	if !errors.As(err, &transition) {
		t.Fatalf("draft -> completed returned %v, want a TransitionError", err)
	}
	if transition.From != string(domain.ProjectDraft) || transition.To != completed {
		t.Errorf("TransitionError said %s -> %s, want draft -> completed", transition.From, transition.To)
	}
	if !errors.Is(err, domain.ErrIllegalTransition) {
		t.Error("the TransitionError does not unwrap to ErrIllegalTransition")
	}

	// The legal move is accepted.
	published := string(domain.ProjectPublished)
	updated, err := svc.UpdateOwnProject(context.Background(), owner, proj.ID,
		domain.UpdateProjectPayload{Status: &published})
	if err != nil {
		t.Fatalf("draft -> published was refused: %v", err)
	}
	if updated.Status != domain.ProjectPublished {
		t.Errorf("status after publishing = %q, want published", updated.Status)
	}
}

// Validation runs on the service, not only in the browser.
func TestProjectValidationRejectsBadInput(t *testing.T) {
	svc, owner, _ := twoAccounts(t)
	ctx := context.Background()

	cases := []struct {
		name    string
		payload domain.CreateProjectPayload
		field   string
	}{
		{
			name:    "a blank title",
			payload: domain.CreateProjectPayload{Title: "   ", Description: "something"},
			field:   "title",
		},
		{
			name:    "a title past the column width",
			payload: domain.CreateProjectPayload{Title: longString(201), Description: "something"},
			field:   "title",
		},
		{
			name: "an unknown currency",
			payload: domain.CreateProjectPayload{
				Title: "Valid", Description: "Valid", Currency: "XYZ",
			},
			field: "currency",
		},
		{
			name: "an unknown budget type",
			payload: domain.CreateProjectPayload{
				Title: "Valid", Description: "Valid", BudgetType: "monthly",
			},
			field: "budget_type",
		},
		{
			name: "more skills than the cap",
			payload: domain.CreateProjectPayload{
				Title: "Valid", Description: "Valid", SkillsRequired: manySkills(31),
			},
			field: "skills",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := svc.CreateProject(ctx, owner, tc.payload)
			var validation *domain.ValidationError
			if !errors.As(err, &validation) {
				t.Fatalf("got %v, want a ValidationError", err)
			}
			if validation.Field != tc.field {
				t.Errorf("ValidationError named %q, want %q", validation.Field, tc.field)
			}
			if !errors.Is(err, domain.ErrValidation) {
				t.Error("the ValidationError does not unwrap to ErrValidation")
			}
		})
	}
}

// Duplicate skills are one skill. Storing "Go" and "go" separately would split
// every search over that skill in two.
func TestSkillsAreDeduplicatedCaseInsensitively(t *testing.T) {
	svc, owner, _ := twoAccounts(t)

	payload := draftProject()
	payload.SkillsRequired = []string{"Go", "go", " GO ", "PostgreSQL", ""}
	proj, err := svc.CreateProject(context.Background(), owner, payload)
	if err != nil {
		t.Fatalf("CreateProject: %v", err)
	}
	if len(proj.SkillsRequired) != 2 {
		t.Fatalf("skills = %v, want two entries", proj.SkillsRequired)
	}
	// The first spelling the caller used is the one kept.
	if proj.SkillsRequired[0] != "Go" {
		t.Errorf("kept skill spelling %q, want %q", proj.SkillsRequired[0], "Go")
	}
}

// Milestone sums are integer arithmetic. Three payments of a third of 100.00
// must sum to exactly 100.00, which they do not in binary floating point.
func TestMilestoneTotalsSumExactly(t *testing.T) {
	total := domain.Money{MinorUnits: 10000, Currency: "AED"}
	thirds := []domain.Money{
		{MinorUnits: 3333, Currency: "AED"},
		{MinorUnits: 3333, Currency: "AED"},
		{MinorUnits: 3334, Currency: "AED"},
	}
	if err := ValidateMilestoneTotal(thirds, total); err != nil {
		t.Errorf("three exact thirds of 100.00 were refused: %v", err)
	}

	short := []domain.Money{
		{MinorUnits: 3333, Currency: "AED"},
		{MinorUnits: 3333, Currency: "AED"},
		{MinorUnits: 3333, Currency: "AED"},
	}
	if err := ValidateMilestoneTotal(short, total); err == nil {
		t.Error("milestones summing to 99.99 were accepted against a 100.00 total")
	}

	mixed := []domain.Money{{MinorUnits: 10000, Currency: "USD"}}
	if err := ValidateMilestoneTotal(mixed, total); err == nil {
		t.Error("a USD milestone was accepted against an AED total")
	}
}

func longString(n int) string {
	out := make([]byte, n)
	for i := range out {
		out[i] = 'a'
	}
	return string(out)
}

func manySkills(n int) []string {
	out := make([]string, 0, n)
	for i := 0; i < n; i++ {
		out = append(out, string(rune('a'+i%26))+string(rune('a'+i/26))+"-skill")
	}
	return out
}
