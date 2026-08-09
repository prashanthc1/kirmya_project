package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"kirmya/internal/company/domain"
	"kirmya/internal/company/models"

	"github.com/google/uuid"
)

// GenerateInsights reads a company's private hiring data, so it has to refuse a
// caller with no identity before it reaches a query.
func TestGenerateInsightsRefusesAnonymousCallers(t *testing.T) {
	svc := offlineManagement()

	_, err := svc.GenerateInsights(context.Background(), anonymous(), uuid.New(), time.Time{}, time.Time{})
	if !errors.Is(err, domain.ErrUnauthenticated) {
		t.Fatalf("GenerateInsights(anonymous) = %v, want ErrUnauthenticated", err)
	}
}

// The single rule this whole file exists to protect: an insight must be
// traceable to a number the company already owns.
func TestEveryInsightCarriesEvidence(t *testing.T) {
	detail := &models.CompanyDetail{}
	analytics := &models.CompanyAnalytics{
		Applications:          40,
		JobViews:              900,
		ApplicationConversion: 4.4,
		InterviewRate:         30,
		OfferRate:             12,
		HireRate:              60,
		Series: []models.AnalyticsPoint{
			{JobViews: 300, Applications: 30},
			{JobViews: 250, Applications: 25},
			{JobViews: 200, Applications: 10},
			{JobViews: 150, Applications: 5},
		},
		RecruiterActivity: []models.RecruiterActivityItem{{Name: "Dana"}},
	}
	jobs := &models.CompanyJobsPage{Items: []models.CompanyJob{
		{Title: "Backend Engineer", Status: "published", ViewsCount: 120},
		{Title: "Draft Role", Status: "draft"},
	}}

	groups := [][]models.CompanyInsight{
		profileInsights(detail),
		verificationInsight(detail),
		funnelInsights(analytics),
		trendInsights(analytics),
		jobPostingInsights(jobs),
		recruiterInsights(analytics),
	}

	total := 0
	for _, group := range groups {
		for _, insight := range group {
			total++
			if len(insight.Evidence) == 0 {
				t.Errorf("insight %q has no evidence", insight.ID)
			}
			if strings.TrimSpace(insight.Title) == "" || strings.TrimSpace(insight.Detail) == "" {
				t.Errorf("insight %q is missing a title or detail", insight.ID)
			}
		}
	}
	if total == 0 {
		t.Fatal("no insights were produced from a fixture designed to trigger several")
	}
}

func TestProfileInsightsNamesEmptySections(t *testing.T) {
	detail := &models.CompanyDetail{ProfileCompletion: 20}

	insights := profileInsights(detail)

	incomplete := findInsight(t, insights, "profile.incomplete")
	for _, section := range []string{"description", "logo", "mission", "benefits"} {
		if !strings.Contains(incomplete.Detail, section) {
			t.Errorf("incomplete insight does not name the empty %q section: %s", section, incomplete.Detail)
		}
	}
}

// A complete profile should produce no profile findings at all: the report is
// only worth reading if it stays quiet when there is nothing to say.
func TestProfileInsightsSilentWhenComplete(t *testing.T) {
	detail := &models.CompanyDetail{
		CompanySummary: models.CompanySummary{
			Tagline:      "We move freight",
			LogoURL:      "https://cdn.example.com/logo.png",
			CoverURL:     "https://cdn.example.com/cover.png",
			Industry:     "Logistics",
			CompanySize:  "201-500",
			Headquarters: "Lisbon, Portugal",
		},
		Description:       strings.Repeat("word ", 80),
		Website:           "https://example.com",
		Mission:           "Move freight with less waste.",
		Vision:            "Zero empty miles.",
		WorkCulture:       "Small teams, long horizons.",
		Benefits:          []string{"Health cover"},
		Values:            []string{"Candour"},
		Specialties:       []string{"Freight"},
		ProfileCompletion: 100,
	}

	if insights := profileInsights(detail); len(insights) != 0 {
		t.Fatalf("complete profile produced %d insight(s): %+v", len(insights), insights)
	}
}

// Verification is the one badge on the page, so the insight must never read as
// though an unverified company were verified.
func TestVerificationInsightTracksStatus(t *testing.T) {
	cases := []struct {
		status       domain.VerificationStatus
		verified     bool
		wantInsight  bool
		wantSeverity models.InsightSeverity
	}{
		{domain.VerificationVerified, true, false, ""},
		{domain.VerificationNotVerified, false, true, models.InsightSuggestion},
		{domain.VerificationPending, false, true, models.InsightInfo},
		{domain.VerificationRejected, false, true, models.InsightWarning},
		{domain.VerificationExpired, false, true, models.InsightWarning},
	}

	for _, tc := range cases {
		t.Run(string(tc.status), func(t *testing.T) {
			detail := &models.CompanyDetail{CompanySummary: models.CompanySummary{
				VerificationStatus: tc.status,
				IsVerified:         tc.verified,
			}}

			insights := verificationInsight(detail)
			if !tc.wantInsight {
				if len(insights) != 0 {
					t.Fatalf("verified company produced %d insight(s)", len(insights))
				}
				return
			}
			if len(insights) != 1 {
				t.Fatalf("got %d insight(s), want 1", len(insights))
			}
			if insights[0].Severity != tc.wantSeverity {
				t.Errorf("severity = %q, want %q", insights[0].Severity, tc.wantSeverity)
			}
		})
	}
}

// Below the sample floor the funnel reports counts instead of percentages, so a
// single application cannot be presented as a 100% rate.
func TestFunnelInsightsWithholdsRatesOnSmallSamples(t *testing.T) {
	analytics := &models.CompanyAnalytics{
		JobViews:              40,
		Applications:          3,
		ApplicationConversion: 7.5,
		InterviewRate:         100,
	}

	insight := findInsight(t, funnelInsights(analytics), "funnel.sample")
	if strings.Contains(insight.Detail, "%") {
		t.Errorf("small-sample funnel insight quotes a percentage: %s", insight.Detail)
	}
}

func TestFunnelInsightsNamesWeakestStage(t *testing.T) {
	analytics := &models.CompanyAnalytics{
		JobViews:              1000,
		Applications:          100,
		ApplicationConversion: 10,
		InterviewRate:         40,
		OfferRate:             2, // weakest
		HireRate:              70,
	}

	insight := findInsight(t, funnelInsights(analytics), "funnel.weakest")
	if !strings.Contains(insight.Title, "interview to offer") {
		t.Errorf("weakest stage = %q, want interview to offer", insight.Title)
	}
}

func TestFunnelInsightsSilentWithoutTraffic(t *testing.T) {
	if insights := funnelInsights(&models.CompanyAnalytics{}); len(insights) != 0 {
		t.Fatalf("empty analytics produced %d funnel insight(s)", len(insights))
	}
}

func TestTrendInsightsDetectsFallingApplications(t *testing.T) {
	analytics := &models.CompanyAnalytics{Series: []models.AnalyticsPoint{
		{JobViews: 100, Applications: 40},
		{JobViews: 100, Applications: 40},
		{JobViews: 90, Applications: 10},
		{JobViews: 90, Applications: 10},
	}}

	insight := findInsight(t, trendInsights(analytics), "trends.direction")
	if insight.Severity != models.InsightWarning {
		t.Errorf("severity = %q, want warning", insight.Severity)
	}
	if !strings.Contains(insight.Title, "falling") {
		t.Errorf("title = %q, want a falling-applications title", insight.Title)
	}
}

// A series with no history behind it cannot support a direction claim.
func TestTrendInsightsSilentOnShortSeries(t *testing.T) {
	analytics := &models.CompanyAnalytics{Series: []models.AnalyticsPoint{
		{JobViews: 10, Applications: 1},
		{JobViews: 12, Applications: 2},
	}}

	if insights := trendInsights(analytics); len(insights) != 0 {
		t.Fatalf("short series produced %d trend insight(s)", len(insights))
	}
}

func TestJobPostingInsightsFlagsMissingFieldsAndDrafts(t *testing.T) {
	expiring := time.Now().UTC().AddDate(0, 0, 3)
	jobs := &models.CompanyJobsPage{Items: []models.CompanyJob{
		{Title: "Open, complete", Status: "published", SalaryRange: "€60k-€80k", Skills: []string{"Go"}},
		{Title: "No salary", Status: "published", Skills: []string{"Go"}},
		{Title: "No skills", Status: "published", SalaryRange: "€60k-€80k"},
		{Title: "Seen never applied", Status: "published", SalaryRange: "€1", Skills: []string{"Go"}, ViewsCount: 120},
		{Title: "Expiring", Status: "published", SalaryRange: "€1", Skills: []string{"Go"}, ExpiresAt: &expiring},
		{Title: "A draft", Status: "draft"},
	}}

	insights := jobPostingInsights(jobs)

	fields := findInsight(t, insights, "jobs.fields")
	if !strings.Contains(fields.Detail, "1 have no salary range") {
		t.Errorf("missing-fields detail = %q", fields.Detail)
	}

	starved := findInsight(t, insights, "jobs.no_applications")
	if !strings.Contains(starved.Detail, "Seen never applied") {
		t.Errorf("starved-job detail does not name the job: %s", starved.Detail)
	}

	drafts := findInsight(t, insights, "jobs.drafts")
	if !strings.Contains(drafts.Detail, "1 job(s)") {
		t.Errorf("draft detail = %q", drafts.Detail)
	}

	findInsight(t, insights, "jobs.expiring")
}

// Closed and draft jobs are not open roles, so their fields must not be
// counted against the company.
func TestJobPostingInsightsIgnoresClosedJobs(t *testing.T) {
	jobs := &models.CompanyJobsPage{Items: []models.CompanyJob{
		{Title: "Closed, incomplete", Status: "closed"},
		{Title: "Expired, incomplete", Status: "expired"},
	}}

	for _, insight := range jobPostingInsights(jobs) {
		if insight.ID == "jobs.fields" {
			t.Fatalf("closed jobs were counted as missing fields: %s", insight.Detail)
		}
	}
}

func TestRecruiterInsightsFlagsIdleRecruiters(t *testing.T) {
	analytics := &models.CompanyAnalytics{RecruiterActivity: []models.RecruiterActivityItem{
		{Name: "Dana", ApplicationsRead: 40, Interviews: 6, Hires: 1},
		{Name: "Sam"},
	}}

	insight := findInsight(t, recruiterInsights(analytics), "recruiters.activity")
	if insight.Severity != models.InsightSuggestion {
		t.Errorf("severity = %q, want suggestion", insight.Severity)
	}
	if !strings.Contains(insight.Detail, "1 of 2") {
		t.Errorf("detail = %q, want it to count the idle recruiter", insight.Detail)
	}
}

// Suggested skills are counted from the company's own open jobs. Anything else
// would be a guess presented as the company's hiring need.
func TestTopJobSkillsCountsOpenJobsOnly(t *testing.T) {
	jobs := &models.CompanyJobsPage{Items: []models.CompanyJob{
		{Status: "published", Skills: []string{"Go", "PostgreSQL"}},
		{Status: "published", Skills: []string{"Go", "Kubernetes"}},
		{Status: "published", Skills: []string{"Go"}},
		{Status: "closed", Skills: []string{"COBOL", "COBOL", "COBOL", "COBOL"}},
		{Status: "draft", Skills: []string{"Fortran"}},
	}}

	got := topJobSkills(jobs, 10)

	if len(got) == 0 || got[0] != "Go" {
		t.Fatalf("topJobSkills = %v, want Go first", got)
	}
	for _, skill := range got {
		if skill == "COBOL" || skill == "Fortran" {
			t.Errorf("skill %q came from a closed or draft job", skill)
		}
	}
}

// Repeating a skill within one job says nothing about demand across the
// company, so it must not inflate the count.
func TestTopJobSkillsDeduplicatesWithinAJob(t *testing.T) {
	jobs := &models.CompanyJobsPage{Items: []models.CompanyJob{
		{Status: "published", Skills: []string{"Go", "go", " Go "}},
		{Status: "published", Skills: []string{"Rust"}},
		{Status: "published", Skills: []string{"Rust"}},
	}}

	got := topJobSkills(jobs, 10)
	if len(got) == 0 || got[0] != "Rust" {
		t.Fatalf("topJobSkills = %v, want Rust first (2 jobs) over Go (1 job)", got)
	}
}

func TestTopJobSkillsHandlesNoJobs(t *testing.T) {
	if got := topJobSkills(nil, 5); len(got) != 0 {
		t.Fatalf("topJobSkills(nil) = %v, want empty", got)
	}
}

func TestSummarizeReportsOnlyGivenFigures(t *testing.T) {
	analytics := &models.CompanyAnalytics{
		ProfileViews:   120,
		UniqueVisitors: 90,
		JobViews:       300,
		Applications:   14,
		FollowerGrowth: -3,
	}
	jobs := &models.CompanyJobsPage{Items: []models.CompanyJob{
		{Status: "published"},
		{Status: "closed"},
	}}

	summary := summarize(analytics, jobs)

	for _, want := range []string{"120 view(s)", "90 unique", "1 open job(s)", "300 job view(s)", "14 application(s)", "-3"} {
		if !strings.Contains(summary, want) {
			t.Errorf("summary is missing %q: %s", want, summary)
		}
	}
}

// A zero baseline has no defined percentage change; reporting one would put an
// infinity on the dashboard.
func TestPercentChangeHandlesZeroBaseline(t *testing.T) {
	if got := percentChange(0, 50); got != 0 {
		t.Errorf("percentChange(0, 50) = %v, want 0", got)
	}
	if got := percentChange(200, 100); got != -50 {
		t.Errorf("percentChange(200, 100) = %v, want -50", got)
	}
}

func findInsight(t *testing.T, insights []models.CompanyInsight, id string) models.CompanyInsight {
	t.Helper()
	for _, insight := range insights {
		if insight.ID == id {
			return insight
		}
	}
	t.Fatalf("insight %q not found in %+v", id, insights)
	return models.CompanyInsight{}
}
