package service

import (
	"testing"

	"kirmya/internal/applications/models"
)

// F14. The insights endpoint must report arithmetic over the candidate's own
// applications, or say it cannot.
//
// It previously returned constants: a profile match score of 85 (90 once the
// candidate had applied to anything), a resume score of that minus four, a 75%
// "application success rate" and a fixed list of three missing skills. The web
// client rendered them as personalised measurements with progress bars.

// insightsFor runs the calculation over applications at the given stages.
func insightsFor(stages ...models.ApplicationStage) *models.AIApplicationInsightsDTO {
	apps := make([]models.ApplicationSummary, 0, len(stages))
	for _, stage := range stages {
		apps = append(apps, models.ApplicationSummary{CurrentStatus: stage})
	}
	return computeApplicationInsights(apps)
}

func TestInsightsRefuseToRateTooFewApplications(t *testing.T) {
	for _, count := range []int{0, 1, 2} {
		stages := make([]models.ApplicationStage, count)
		for i := range stages {
			stages[i] = models.StageInterview
		}

		insights := insightsFor(stages...)
		if insights.Sufficient {
			t.Errorf("%d applications reported as sufficient", count)
		}
		// All three at interview would otherwise read as a 100% interview rate,
		// which is exactly the kind of confident nonsense this guards against.
		if insights.InterviewRate != 0 {
			t.Errorf("%d applications produced an interview rate of %v", count, insights.InterviewRate)
		}
	}
}

func TestInsightsComputeRealRates(t *testing.T) {
	// Four applications that count: one still Applied (no response), one
	// Rejected (a response), one at Interview, one at Offer.
	insights := insightsFor(
		models.StageApplied,
		models.StageRejected,
		models.StageInterview,
		models.StageOffer,
	)

	if !insights.Sufficient {
		t.Fatal("four applications reported as insufficient")
	}
	if insights.ApplicationsConsidered != 4 {
		t.Errorf("considered %d applications, want 4", insights.ApplicationsConsidered)
	}
	// Three of four drew some response; only the still-Applied one did not.
	if insights.ResponseRate != 75.0 {
		t.Errorf("ResponseRate = %v, want 75", insights.ResponseRate)
	}
	// Interview and Offer both count as having reached interview.
	if insights.InterviewRate != 50.0 {
		t.Errorf("InterviewRate = %v, want 50", insights.InterviewRate)
	}
	if insights.OfferRate != 25.0 {
		t.Errorf("OfferRate = %v, want 25", insights.OfferRate)
	}
}

// Withdrawing an application says nothing about how the employer responded, so
// it must not sit in the denominator dragging every rate down.
func TestWithdrawnAndDraftApplicationsAreExcluded(t *testing.T) {
	insights := insightsFor(
		models.StageInterview,
		models.StageInterview,
		models.StageInterview,
		models.StageWithdrawn,
		models.StageDraft,
	)

	if insights.ApplicationsConsidered != 3 {
		t.Errorf("considered %d, want 3 — withdrawn and draft must not count", insights.ApplicationsConsidered)
	}
	if insights.InterviewRate != 100.0 {
		t.Errorf("InterviewRate = %v, want 100", insights.InterviewRate)
	}
}

// The guidance is standing advice and must not be dressed as personal analysis.
func TestGuidanceIsPresentAndImpersonal(t *testing.T) {
	a := insightsFor(models.StageApplied)
	b := insightsFor(models.StageApplied, models.StageInterview, models.StageOffer, models.StageRejected)

	if len(a.GeneralGuidance) == 0 {
		t.Error("no guidance offered")
	}
	// Identical for both candidates: it is general advice, and the field name
	// and payload should both admit that rather than implying a personal read.
	if len(a.GeneralGuidance) != len(b.GeneralGuidance) {
		t.Error("guidance differs between candidates, implying personalisation that does not exist")
	}
	for i := range a.GeneralGuidance {
		if a.GeneralGuidance[i] != b.GeneralGuidance[i] {
			t.Errorf("guidance %d differs between candidates", i)
		}
	}
}
