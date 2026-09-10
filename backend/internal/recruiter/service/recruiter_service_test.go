package service

import (
	"context"
	"testing"

	"kirmya/internal/recruiter/models"
	"kirmya/internal/recruiter/repository"

	"github.com/google/uuid"
)

// Onboarding, job creation and the rest of the workflow all write rows, so with
// no database they fail.
//
// This asserted the opposite: that a service built on a nil repository could
// onboard a recruiter, read back "Kirmya Tech Solutions", and create a job. It
// passed because GetOrCreateProfile answered a nil-database caller with an
// invented profile - "Senior Talent Partner" at recruiter@kirmya.ae, marked
// Verified - and that same fabrication is what let any authenticated account
// acquire recruiter authority by loading a page.
func TestRecruiterService_WorkflowNeedsADatabase(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()
	userID := uuid.New()

	if _, err := svc.SubmitOnboarding(ctx, userID, &models.OnboardingPayload{
		CompanyName:   "Kirmya Tech Solutions",
		JobTitle:      "Head of Talent",
		RecruiterRole: "Organization Owner",
		ContactEmail:  "headofpersonnel@kirmya.ae",
	}); err == nil {
		t.Error("expected onboarding with no database to fail rather than answer with an invented profile")
	}

	if _, err := svc.CreateJob(ctx, userID, &models.CreateJobPayload{Title: "Senior Go Engineer"}); err == nil {
		t.Error("expected job creation with no database to fail")
	}
}

// Recruiter capability is read from the database and nothing else. With no
// database the answer is an error, never a grant.
func TestRecruiterCapabilityNeverGrantsWithoutADatabase(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)

	capability, err := svc.RecruiterCapability(context.Background(), uuid.New())
	if err == nil {
		t.Error("expected a capability lookup with no database to fail")
	}
	if capability == CapabilityActive {
		t.Error("a failed capability lookup reported an active capability; a failure must never become access")
	}
}

// CandidateNotes reaches the database through the caller's recruiter profile, so with
// no database it fails rather than operating on a fabricated one.
func TestRecruiterService_CandidateNotesNeedsADatabase(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()

	if _, err := svc.GetRecruiterProfile(ctx, uuid.New()); err == nil {
		t.Error("expected the profile read backing CandidateNotes to fail with no database")
	}
}

// CandidateEvaluation reaches the database through the caller's recruiter profile, so with
// no database it fails rather than operating on a fabricated one.
func TestRecruiterService_CandidateEvaluationNeedsADatabase(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()

	if _, err := svc.GetRecruiterProfile(ctx, uuid.New()); err == nil {
		t.Error("expected the profile read backing CandidateEvaluation to fail with no database")
	}
}

func TestRecruiterService_StageHistory(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()
	appID := uuid.New()

	// Same boundary as the evaluations above: no database, no ownership proof,
	// no history. The fixture this used to assert on described an application
	// the caller had no claim to.
	if _, err := svc.GetStageHistory(ctx, uuid.New(), appID); err == nil {
		t.Error("expected an error reading stage history with no database to check ownership against")
	}
}

// The overview is counted from the caller's own jobs and applications now, so
// with no database there is nothing to count and the call fails.
//
// This test used to assert the opposite: that a recruiter with no database
// behind them still got a non-zero applicant count and a non-empty job list.
// It passed because the counts were literals - 142 applicants, 12 hires -
// returned to every recruiter on the platform.
func TestRecruiterService_DashboardOverviewNeedsADatabase(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)

	if _, err := svc.GetDashboardOverview(context.Background(), uuid.New()); err == nil {
		t.Error("expected an error building the dashboard overview with no database to count from")
	}
}

// Candidate search is a query over the people who have applied to the caller's
// jobs. With no database it fails rather than answering with invented people.
func TestRecruiterService_CandidatesNeedADatabase(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)

	if _, err := svc.GetCandidates(context.Background(), uuid.New()); err == nil {
		t.Error("expected an error listing candidates with no database to read")
	}
}

// BulkActions reaches the database through the caller's recruiter profile, so with
// no database it fails rather than operating on a fabricated one.
func TestRecruiterService_BulkActionsNeedsADatabase(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()

	if _, err := svc.GetRecruiterProfile(ctx, uuid.New()); err == nil {
		t.Error("expected the profile read backing BulkActions to fail with no database")
	}
}

func TestRecruiterService_PipelineStageUpdate(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()
	userID := uuid.New()
	pipelineID := uuid.New()

	payload := &models.UpdateStagePayload{
		Stage: "Shortlisted",
		Notes: "Advanced after technical screening",
	}

	err := svc.UpdatePipelineStage(ctx, userID, pipelineID, payload)
	if err != nil {
		t.Fatalf("UpdatePipelineStage failed: %v", err)
	}
}

// CompanyIsolation reaches the database through the caller's recruiter profile, so with
// no database it fails rather than operating on a fabricated one.
func TestRecruiterService_CompanyIsolationNeedsADatabase(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()

	if _, err := svc.GetRecruiterProfile(ctx, uuid.New()); err == nil {
		t.Error("expected the profile read backing CompanyIsolation to fail with no database")
	}
}
