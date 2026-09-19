//go:build ciintegration

package ci

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"testing"
)

// The recruiter journey, end to end, against the running API and a real
// PostgreSQL.
//
// F26: the recruiter module answered from literals compiled into the binary.
// `NewSearchService` constructed the candidate engine - the one that reports
// its name as "postgresql-tsvector-v2" - with a nil pool, so the branch that
// reaches the database was unreachable in every environment and production
// always took the one commented "Mock candidates fallback for testing and
// development": Sarah Chen at 96%, Tariq Al-Mansoor at 94%, Elena Rostova at
// 91%, with resume URLs under kirmya.com that resolve to nothing. The
// dashboard's counts were literals too - 142 applicants, 3 offers, 12
// successful hires - returned to a recruiter who had posted nothing.
//
// The unit tests written alongside the fix only assert that these calls fail
// without a database. That proves they no longer invent; it does not prove
// they read. This does: it seeds a real posting and a real applicant through
// the API, then requires that exact person to come back, and requires the
// counts to move because of them.
//
// It is also what caught the fix's own defect. The first version of the
// candidate query joined `profiles`, which carries job_title and location but
// not headline, and is not the table `user_skills.profile_id` references. The
// endpoint answered `column p.headline does not exist` on every call. Every
// unit test still passed, because none of them had a database to be wrong
// against.
func TestF26RecruiterJourneyReadsRealRecords(t *testing.T) {
	base := required(t, "TEST_API_URL")

	recruiter := becomeRecruiter(t, base, registerAndLogin(t, base))
	candidate := registerAndLogin(t, base)

	// A recruiter with nothing posted starts at zero, and says zero rather
	// than 142.
	before := dashboardOf(t, base, recruiter.token)
	if before.TotalApplicantsCount != 0 || before.SuccessfulHiresCount != 0 {
		t.Fatalf("a recruiter who has posted nothing reported %d applicants and %d hires; "+
			"these were the literals 142 and 12", before.TotalApplicantsCount, before.SuccessfulHiresCount)
	}

	// Before any application exists, this recruiter has no candidates. The
	// fabrication answered three.
	if got := candidatesOf(t, base, recruiter.token); len(got) != 0 {
		t.Fatalf("a recruiter with no applicants was served %d candidates: %v", len(got), namesOf(got))
	}

	jobID := publishJobAs(t, base, recruiter.token, "F26 Journey Platform Engineer")

	applyTo(t, base, candidate.token, jobID)

	// The candidate list is now exactly the person who applied.
	after := candidatesOf(t, base, recruiter.token)
	if len(after) != 1 {
		t.Fatalf("expected exactly the one real applicant, got %d: %v", len(after), namesOf(after))
	}
	if after[0].ID != candidate.id {
		t.Errorf("candidate list returned id %s, want the applicant %s", after[0].ID, candidate.id)
	}

	// The specific fabrications must not be reachable through this endpoint.
	for _, invented := range []string{"Sarah Chen", "Tariq Al-Mansoor", "Elena Rostova"} {
		for _, c := range after {
			if strings.Contains(c.Name, invented) {
				t.Errorf("candidate search returned the invented person %q", invented)
			}
		}
	}

	// A match score of 96 was attached to a candidate nobody had scored.
	// Nothing computes one here, so nothing claims one.
	if after[0].MatchScore != 0 {
		t.Errorf("candidate carries match score %d; no score is computed for a search result",
			after[0].MatchScore)
	}
	if strings.Contains(after[0].ResumeURL, "kirmya.com/resumes") {
		t.Errorf("candidate carries the fabricated resume URL %q", after[0].ResumeURL)
	}

	// The counts moved because a real person applied.
	afterCounts := dashboardOf(t, base, recruiter.token)
	if afterCounts.TotalApplicantsCount != 1 {
		t.Errorf("dashboard reports %d applicants after exactly one application",
			afterCounts.TotalApplicantsCount)
	}
	if afterCounts.ActiveJobsCount != 1 {
		t.Errorf("dashboard reports %d active jobs after exactly one posting",
			afterCounts.ActiveJobsCount)
	}
	// "New applicants" counted the stage "New", which no row ever holds, so
	// the tile was structurally always zero. The stage an application is
	// actually created in is "Applied".
	if afterCounts.NewCandidatesCount != 1 {
		t.Errorf("dashboard reports %d new applicants; a just-submitted application is in stage "+
			"'Applied' and must be counted", afterCounts.NewCandidatesCount)
	}

	// The activity feed had two literal entries, one naming a candidate who
	// does not exist. Nothing records activities, so the list is empty.
	for _, a := range afterCounts.RecentActivities {
		if strings.Contains(a.Description, "Tariq Al-Mansoor") {
			t.Errorf("dashboard activity feed still carries the invented entry %q", a.Description)
		}
	}
}

// A recruiter must not reach a member of the platform who has not applied to
// one of their jobs. GetCandidateDetail used to run an unfiltered search and
// return whichever candidate came back first, so every id resolved to the same
// person and the endpoint was a read of the whole directory.
func TestF26CandidateLookupIsScopedToTheRecruitersOwnApplicants(t *testing.T) {
	base := required(t, "TEST_API_URL")

	recruiter := becomeRecruiter(t, base, registerAndLogin(t, base))
	applicant := registerAndLogin(t, base)
	stranger := registerAndLogin(t, base)

	jobID := publishJobAs(t, base, recruiter.token, "F26 Scope Platform Engineer")
	applyTo(t, base, applicant.token, jobID)

	// The person who applied is readable, and is the person asked for.
	resp := do(t, http.MethodGet, base+"/api/v1/recruiter/candidates/"+applicant.id, recruiter.token, nil)
	body, _ := readBody(resp)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("reading own applicant: got %d want 200: %s", resp.StatusCode, body)
	}
	var got recruiterCandidate
	if err := json.Unmarshal([]byte(body), &got); err != nil {
		t.Fatal(err)
	}
	if got.ID != applicant.id {
		t.Errorf("asked for candidate %s and was given %s", applicant.id, got.ID)
	}

	// Someone who has not applied is not readable through this endpoint.
	strangerResp := do(t, http.MethodGet, base+"/api/v1/recruiter/candidates/"+stranger.id, recruiter.token, nil)
	strangerBody, _ := readBody(strangerResp)
	if strangerResp.StatusCode == http.StatusOK {
		t.Errorf("a recruiter read a member who never applied to their jobs: %s", strangerBody)
	}
}

// Saving a candidate returned nil - the value a successful save returns - with
// no store behind it, and the saved list was an unfiltered search, so it
// listed candidates nobody had saved. Reporting a write that did not happen is
// worse than refusing it.
func TestF26SavingACandidateIsRefusedRatherThanFaked(t *testing.T) {
	base := required(t, "TEST_API_URL")

	recruiter := becomeRecruiter(t, base, registerAndLogin(t, base))
	applicant := registerAndLogin(t, base)
	jobID := publishJobAs(t, base, recruiter.token, "F26 Shortlist Platform Engineer")
	applyTo(t, base, applicant.token, jobID)

	saveResp := do(t, http.MethodPost, base+"/api/v1/recruiter/candidates/"+applicant.id+"/save", recruiter.token, map[string]any{})
	saveBody, _ := readBody(saveResp)
	if saveResp.StatusCode >= 200 && saveResp.StatusCode < 300 {
		t.Errorf("saving a candidate reported success (%d) while no shortlist store exists: %s",
			saveResp.StatusCode, saveBody)
	}

	listResp := do(t, http.MethodGet, base+"/api/v1/recruiter/candidates/saved", recruiter.token, nil)
	listBody, _ := readBody(listResp)
	if listResp.StatusCode == http.StatusOK && strings.Contains(listBody, "Sarah Chen") {
		t.Errorf("the saved-candidate list answered with invented people: %s", listBody)
	}
}

// Offers must be scoped to the recruiter who posted the job (jobs.recruiter_id).
// A recruiter with no offers starts with an empty list, never fabricated entries.
// Foreign job or application queries and foreign offer ids must answer 404.
func TestF26RecruiterOffersScopedToOwnJobs(t *testing.T) {
	base := required(t, "TEST_API_URL")

	recruiter := becomeRecruiter(t, base, registerAndLogin(t, base))
	foreignRecruiter := becomeRecruiter(t, base, registerAndLogin(t, base))
	applicant := registerAndLogin(t, base)

	// 1. A recruiter who has issued no offers gets an empty list, not null, not Sarah Chen.
	emptyResp := do(t, http.MethodGet, base+"/api/v1/recruiter/offers", recruiter.token, nil)
	emptyBody, _ := readBody(emptyResp)
	if emptyResp.StatusCode != http.StatusOK {
		t.Fatalf("reading empty offers: got %d want 200: %s", emptyResp.StatusCode, emptyBody)
	}
	if strings.TrimSpace(emptyBody) != "[]" {
		t.Fatalf("expected empty list [], got: %s", emptyBody)
	}
	if strings.Contains(emptyBody, "Sarah Chen") || strings.Contains(emptyBody, "Tariq Al-Mansoor") {
		t.Errorf("empty offers endpoint answered with fabricated persons: %s", emptyBody)
	}

	// 2. Querying with a non-existent / foreign job ID must 404.
	foreignJobResp := do(t, http.MethodGet, base+"/api/v1/recruiter/offers?jobId=00000000-0000-0000-0000-000000000000", recruiter.token, nil)
	foreignJobBody, _ := readBody(foreignJobResp)
	if foreignJobResp.StatusCode != http.StatusNotFound {
		t.Errorf("querying offers for non-existent job ID: got %d want 404: %s", foreignJobResp.StatusCode, foreignJobBody)
	}

	// 3. Querying with a non-existent / foreign offer ID must 404.
	foreignOfferResp := do(t, http.MethodGet, base+"/api/v1/recruiter/offers/00000000-0000-0000-0000-000000000000", recruiter.token, nil)
	foreignOfferBody, _ := readBody(foreignOfferResp)
	if foreignOfferResp.StatusCode != http.StatusNotFound {
		t.Errorf("querying offers for non-existent offer ID: got %d want 404: %s", foreignOfferResp.StatusCode, foreignOfferBody)
	}

	// 4. Seed a job and application for recruiter.
	jobID := publishJobAs(t, base, recruiter.token, "F26 Offers Platform Engineer")
	applyTo(t, base, applicant.token, jobID)

	// Retrieve the real application ID.
	appsResp := do(t, http.MethodGet, base+"/api/v1/recruiter/applications?jobId="+jobID, recruiter.token, nil)
	appsBody, _ := readBody(appsResp)
	if appsResp.StatusCode != http.StatusOK {
		t.Fatalf("getting applications: got %d: %s", appsResp.StatusCode, appsBody)
	}
	var apps []struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal([]byte(appsBody), &apps); err != nil || len(apps) == 0 {
		t.Fatalf("could not parse applications from %s: %v", appsBody, err)
	}
	appID := apps[0].ID

	// Querying with foreign recruiter's token on this job must 404.
	intruderJobResp := do(t, http.MethodGet, base+"/api/v1/recruiter/offers?jobId="+jobID, foreignRecruiter.token, nil)
	intruderJobBody, _ := readBody(intruderJobResp)
	if intruderJobResp.StatusCode != http.StatusNotFound {
		t.Errorf("foreign recruiter querying job offers: got %d want 404: %s", intruderJobResp.StatusCode, intruderJobBody)
	}

	// 5. Create an offer.
	offerPayload := map[string]any{
		"application_id": appID,
		"job_id":         jobID,
		"candidate_id":   applicant.id,
		"position_title": "F26 Offers Platform Engineer",
		"salary":         "130,000 USD",
		"currency":       "USD",
		"benefits":       "Full medical, remote stipend",
		"joining_date":   "2026-10-01",
		"contract_type":  "Full-time",
	}
	createResp := do(t, http.MethodPost, base+"/api/v1/recruiter/offers", recruiter.token, offerPayload)
	createBody, _ := readBody(createResp)
	if createResp.StatusCode != http.StatusCreated {
		t.Fatalf("creating job offer: got %d want 201: %s", createResp.StatusCode, createBody)
	}
	var createdOffer struct {
		ID            string `json:"id"`
		CandidateName string `json:"candidateName"`
		Status        string `json:"status"`
	}
	if err := json.Unmarshal([]byte(createBody), &createdOffer); err != nil {
		t.Fatalf("decoding created offer %s: %v", createBody, err)
	}
	if createdOffer.CandidateName == "Sarah Chen" {
		t.Errorf("created offer returned fabricated candidate name 'Sarah Chen'")
	}
	if createdOffer.Status != "Sent" {
		t.Errorf("created offer status = %q, want 'Sent'", createdOffer.Status)
	}

	// 6. Recruiter reads back offers list: exactly 1 offer.
	listResp := do(t, http.MethodGet, base+"/api/v1/recruiter/offers", recruiter.token, nil)
	listBody, _ := readBody(listResp)
	if listResp.StatusCode != http.StatusOK {
		t.Fatalf("reading recruiter offers: got %d want 200: %s", listResp.StatusCode, listBody)
	}
	var offersList []struct {
		ID            string `json:"id"`
		CandidateName string `json:"candidateName"`
		PositionTitle string `json:"positionTitle"`
	}
	if err := json.Unmarshal([]byte(listBody), &offersList); err != nil || len(offersList) != 1 {
		t.Fatalf("expected 1 offer, got %d: %s", len(offersList), listBody)
	}
	if offersList[0].ID != createdOffer.ID {
		t.Errorf("offer list id %s != created %s", offersList[0].ID, createdOffer.ID)
	}

	// 7. Foreign recruiter must see empty list and must not see recruiter's offer.
	foreignListResp := do(t, http.MethodGet, base+"/api/v1/recruiter/offers", foreignRecruiter.token, nil)
	foreignListBody, _ := readBody(foreignListResp)
	if foreignListResp.StatusCode != http.StatusOK || strings.TrimSpace(foreignListBody) != "[]" {
		t.Errorf("foreign recruiter saw offers: %d %s", foreignListResp.StatusCode, foreignListBody)
	}

	// Foreign recruiter trying to read recruiter's offer directly -> 404.
	foreignGetResp := do(t, http.MethodGet, base+"/api/v1/recruiter/offers/"+createdOffer.ID, foreignRecruiter.token, nil)
	if foreignGetResp.StatusCode != http.StatusNotFound {
		t.Errorf("foreign recruiter reading offer directly: got %d want 404", foreignGetResp.StatusCode)
	}

	// Foreign recruiter trying to update recruiter's offer status -> 404.
	foreignPutResp := do(t, http.MethodPut, base+"/api/v1/recruiter/offers/"+createdOffer.ID, foreignRecruiter.token, map[string]any{"status": "Accepted"})
	if foreignPutResp.StatusCode != http.StatusNotFound {
		t.Errorf("foreign recruiter updating offer: got %d want 404", foreignPutResp.StatusCode)
	}

	// 8. Recruiter can read single offer and update status.
	getResp := do(t, http.MethodGet, base+"/api/v1/recruiter/offers/"+createdOffer.ID, recruiter.token, nil)
	if getResp.StatusCode != http.StatusOK {
		t.Errorf("recruiter reading own offer: got %d want 200", getResp.StatusCode)
	}

	putResp := do(t, http.MethodPut, base+"/api/v1/recruiter/offers/"+createdOffer.ID, recruiter.token, map[string]any{"status": "Accepted"})
	if putResp.StatusCode != http.StatusOK {
		t.Errorf("recruiter updating own offer: got %d want 200", putResp.StatusCode)
	}
}

// --- helpers -------------------------------------------------------------

type recruiterCandidate struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	MatchScore int    `json:"matchScore"`
	ResumeURL  string `json:"resumeUrl"`
}

type recruiterDashboard struct {
	ActiveJobsCount      int `json:"activeJobsCount"`
	TotalApplicantsCount int `json:"totalApplicantsCount"`
	NewCandidatesCount   int `json:"newCandidatesCount"`
	SuccessfulHiresCount int `json:"successfulHiresCount"`
	RecentActivities     []struct {
		Description string `json:"description"`
	} `json:"recentActivities"`
}

func dashboardOf(t *testing.T, base, token string) recruiterDashboard {
	t.Helper()
	resp := do(t, http.MethodGet, base+"/api/v1/recruiter/dashboard", token, nil)
	body, _ := readBody(resp)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("recruiter dashboard: got %d want 200: %s", resp.StatusCode, body)
	}
	var d recruiterDashboard
	if err := json.Unmarshal([]byte(body), &d); err != nil {
		t.Fatalf("decoding dashboard %q: %v", body, err)
	}
	return d
}

func candidatesOf(t *testing.T, base, token string) []recruiterCandidate {
	t.Helper()
	resp := do(t, http.MethodGet, base+"/api/v1/recruiter/candidates", token, nil)
	body, _ := readBody(resp)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("recruiter candidates: got %d want 200: %s", resp.StatusCode, body)
	}
	var items []recruiterCandidate
	if err := json.Unmarshal([]byte(body), &items); err != nil {
		t.Fatalf("decoding candidates %q: %v", body, err)
	}
	return items
}

func namesOf(items []recruiterCandidate) []string {
	names := make([]string, 0, len(items))
	for _, c := range items {
		names = append(names, c.Name)
	}
	return names
}

func publishJobAs(t *testing.T, base, token, title string) string {
	t.Helper()
	resp := do(t, http.MethodPost, base+"/api/v1/recruiter/jobs", token, map[string]any{
		"title":          title,
		"description":    "A real posting seeded by the F26 recruiter journey test.",
		"status":         "Active",
		"workplaceType":  "Remote",
		"employmentType": "Full-time",
		"location":       "Remote",
	})
	body, _ := readBody(resp)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("publishing a job: got %d want 201: %s", resp.StatusCode, body)
	}
	var created struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal([]byte(body), &created); err != nil {
		t.Fatal(err)
	}
	if created.ID == "" {
		t.Fatalf("published job carried no id: %s", body)
	}
	return created.ID
}

func applyTo(t *testing.T, base, token, jobID string) {
	t.Helper()
	resp := do(t, http.MethodPost, fmt.Sprintf("%s/api/v1/jobs/%s/apply", base, jobID), token, map[string]any{
		"cover_letter": "Submitted by the F26 recruiter journey test.",
	})
	body, _ := readBody(resp)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("applying to job %s: got %d want 201: %s", jobID, resp.StatusCode, body)
	}
}
