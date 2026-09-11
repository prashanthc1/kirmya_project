//go:build ciintegration

package ci

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
)

// Batch 5 covers the domains outside the hiring loop. Every check here runs
// against the real API with real accounts, because the defects it guards
// against - a list that answers null, a table no migration created, a job
// another recruiter can read - all passed unit tests that never made an HTTP
// request.

func batch5Base(t *testing.T) string {
	t.Helper()
	base := os.Getenv("TEST_API_URL")
	if base == "" {
		t.Fatal("TEST_API_URL is required: these checks exercise the running API")
	}
	return strings.TrimRight(base, "/")
}

func getJSON(t *testing.T, base, path, token string) (int, string) {
	t.Helper()
	resp := do(t, http.MethodGet, base+path, token, nil)
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	return resp.StatusCode, string(raw)
}

// TestListEndpointsAnswerWithArrays fails if any list endpoint answers null, or
// an object whose list field is null, for an account that has no rows.
//
// That is what a new account is, and it is what broke the network dashboard:
// connections.length on a null. Sixty-three endpoints across twenty-two modules
// had the same shape.
func TestListEndpointsAnswerWithArrays(t *testing.T) {
	base := batch5Base(t)
	user := registerAndLogin(t, base)

	paths := []string{
		"/api/v1/assessments", "/api/v1/assessments/badges", "/api/v1/assessments/results",
		"/api/v1/career-ai/recommendations", "/api/v1/career-ai/usage",
		"/api/v1/career-companion/conversations",
		"/api/v1/communities", "/api/v1/communities/recommendations",
		"/api/v1/compliance/consent", "/api/v1/compliance/requests",
		"/api/v1/endorsements/recommendations", "/api/v1/endorsements/references", "/api/v1/endorsements/skills",
		"/api/v1/events/my-events", "/api/v1/freelance/contracts",
		"/api/v1/interviews", "/api/v1/interviews/reminders",
		"/api/v1/jobs/matches", "/api/v1/landing/content",
		"/api/v1/learning/certificates", "/api/v1/learning/progress",
		"/api/v1/mentorship/mentors/recommendations", "/api/v1/mentorship/mentors/search",
		"/api/v1/mentorship/relationships", "/api/v1/mentorship/requests",
		"/api/v1/messages/conversations", "/api/v1/messages/requests",
		"/api/v1/network/connections", "/api/v1/network/followers", "/api/v1/network/following",
		"/api/v1/network/goals", "/api/v1/network/requests", "/api/v1/network/requests/sent",
		"/api/v1/notifications", "/api/v1/notifications/devices", "/api/v1/notifications/history",
		"/api/v1/notifications/preferences", "/api/v1/notifications/preferences/categories",
		"/api/v1/notifications/schedules", "/api/v1/notifications/unread",
		"/api/v1/people", "/api/v1/people/search",
		"/api/v1/recommendation-engine/unified",
		"/api/v1/referrals/my-referrals", "/api/v1/referrals/requests",
		"/api/v1/resume-analysis/history",
		"/api/v1/safety/blocks", "/api/v1/safety/mutes", "/api/v1/safety/reports", "/api/v1/safety/restrictions",
		"/api/v1/settings/data-export/history", "/api/v1/settings/notifications",
		"/api/v1/verifications/requests",
	}

	// The recruiter list endpoints need a caller that holds the recruiting
	// capability, so they are checked separately rather than under the ordinary
	// account above. Onboarding the shared probe account instead would have made
	// every other path on this list be answered by a recruiter, which is not the
	// caller these endpoints are meant to be checked with.
	recruiterPaths := []string{
		"/api/v1/recruiter/jobs",
		"/api/v1/recruiter/candidates",
		"/api/v1/recruiter/applications",
		"/api/v1/recruiter/interviews",
	}

	check := func(path, token string) {
		status, body := getJSON(t, base, path, token)
		if status != http.StatusOK {
			t.Errorf("%s: got %d, want 200. Body: %s", path, status, truncateBody(body))
			return
		}
		for _, field := range nullListFields(body) {
			t.Errorf("%s: %s is null; a list endpoint must answer with an array", path, field)
		}
	}

	for _, path := range paths {
		check(path, user.token)
	}

	recruiter := becomeRecruiter(t, base, registerAndLogin(t, base))
	for _, path := range recruiterPaths {
		check(path, recruiter.token)
	}
}

// nullListFields returns "the body" when the whole payload is null, and the
// name of every top-level field that is null otherwise. Fields that are
// legitimately absent - an error string, a paging cursor - are not lists and
// are ignored.
func nullListFields(body string) []string {
	trimmed := strings.TrimSpace(body)
	if trimmed == "null" {
		return []string{"the body"}
	}
	var payload map[string]json.RawMessage
	if err := json.Unmarshal([]byte(trimmed), &payload); err != nil {
		return nil // an array or a scalar: nothing to check
	}
	ignored := map[string]bool{"error": true, "message": true, "cursor": true, "next_cursor": true, "nextCursor": true}
	var nulls []string
	for field, raw := range payload {
		if ignored[field] {
			continue
		}
		if strings.TrimSpace(string(raw)) == "null" {
			nulls = append(nulls, field)
		}
	}
	return nulls
}

// TestRecruiterCannotReachAnotherRecruitersJob covers the ownership boundary for
// 10A. Reading a job by id, changing its status and reading its candidate
// pipeline were all unscoped: any signed-in recruiter could read another
// organization's posting and its applicants, and could close their job.
func TestRecruiterCannotReachAnotherRecruitersJob(t *testing.T) {
	base := batch5Base(t)
	// Both onboard, deliberately. If the intruder were left an ordinary
	// account, its 403s would come from the capability guard and this would
	// stop testing what it is named for - that one recruiter cannot reach
	// another recruiter's job.
	owner := becomeRecruiter(t, base, registerAndLogin(t, base))
	intruder := becomeRecruiter(t, base, registerAndLogin(t, base))

	jobID := publishJobForApplications(t, base, owner.token, "Batch5 Ownership Probe")

	status, body := getJSON(t, base, "/api/v1/recruiter/jobs/"+jobID, owner.token)
	if status != http.StatusOK {
		t.Fatalf("owner GET job: got %d, want 200. Body: %s", status, truncateBody(body))
	}

	foreign := []struct {
		method string
		path   string
		body   any
	}{
		{http.MethodGet, "/api/v1/recruiter/jobs/" + jobID, nil},
		{http.MethodGet, "/api/v1/recruiter/pipeline/" + jobID, nil},
		{http.MethodPost, "/api/v1/recruiter/jobs/" + jobID + "/close", map[string]any{}},
		{http.MethodPost, "/api/v1/recruiter/jobs/" + jobID + "/pause", map[string]any{}},
	}
	for _, probe := range foreign {
		resp := do(t, probe.method, base+probe.path, intruder.token, probe.body)
		raw, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusForbidden {
			continue
		}
		t.Errorf("%s %s as a foreign recruiter: got %d, want 404 or 403. Body: %s",
			probe.method, probe.path, resp.StatusCode, truncateBody(string(raw)))
	}

	status, body = getJSON(t, base, "/api/v1/recruiter/jobs/"+jobID, owner.token)
	if status != http.StatusOK {
		t.Fatalf("owner GET job after the foreign writes: got %d. Body: %s", status, truncateBody(body))
	}
	if strings.Contains(strings.ToLower(body), "\"status\":\"closed\"") {
		t.Errorf("a foreign recruiter closed this job: %s", truncateBody(body))
	}
}

// TestNetworkingGoalsPersist covers 10B storage. networking_goals was never
// created by any migration, so every one of these calls answered 500.
func TestNetworkingGoalsPersist(t *testing.T) {
	base := batch5Base(t)
	user := registerAndLogin(t, base)

	resp := do(t, http.MethodPost, base+"/api/v1/network/goals", user.token, map[string]any{
		"title":       "Batch5 goal",
		"targetCount": 5,
		"category":    "connect",
		"deadline":    "2026-12-31",
	})
	raw, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		t.Fatalf("create goal: got %d, want 201. Body: %s", resp.StatusCode, truncateBody(string(raw)))
	}

	status, body := getJSON(t, base, "/api/v1/network/goals", user.token)
	if status != http.StatusOK {
		t.Fatalf("list goals: got %d, want 200. Body: %s", status, truncateBody(body))
	}
	if !strings.Contains(body, "Batch5 goal") {
		t.Errorf("the goal that was just created is not in the list: %s", truncateBody(body))
	}
}

// TestNotificationCategoryPreferenceIsStored covers 10G. The settings screen
// toggles a category; the payload it sends was rejected with 400, and nothing it
// saved was ever consulted when a notification was delivered.
func TestNotificationCategoryPreferenceIsStored(t *testing.T) {
	base := batch5Base(t)
	user := registerAndLogin(t, base)

	status, body := getJSON(t, base, "/api/v1/notifications/preferences", user.token)
	if status != http.StatusOK {
		t.Fatalf("read preferences: got %d. Body: %s", status, truncateBody(body))
	}
	if !strings.Contains(body, "Jobs") {
		t.Fatalf("a new account is shown no default preferences: %s", truncateBody(body))
	}

	resp := do(t, http.MethodPut, base+"/api/v1/notifications/preferences", user.token, map[string]any{
		"category":     "Jobs",
		"emailEnabled": false,
	})
	raw, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("toggle category: got %d, want 200. Body: %s", resp.StatusCode, truncateBody(string(raw)))
	}

	status, body = getJSON(t, base, "/api/v1/notifications/preferences", user.token)
	if status != http.StatusOK {
		t.Fatalf("re-read preferences: got %d. Body: %s", status, truncateBody(body))
	}
	var prefs []struct {
		Category     string `json:"category"`
		EmailEnabled bool   `json:"emailEnabled"`
	}
	if err := json.Unmarshal([]byte(body), &prefs); err != nil {
		t.Fatalf("preferences are not a list: %v. Body: %s", err, truncateBody(body))
	}
	found := false
	for _, p := range prefs {
		if p.Category == "Jobs" {
			found = true
			if p.EmailEnabled {
				t.Errorf("the Jobs email switch went back on after saving: %s", truncateBody(body))
			}
		}
	}
	if !found {
		t.Errorf("no Jobs category in the saved preferences: %s", truncateBody(body))
	}
}

// TestMentorshipIdentityCannotBeSpoofed covers a header the mentorship module
// used to trust: X-User-ID overriding the authenticated caller.
func TestMentorshipIdentityCannotBeSpoofed(t *testing.T) {
	base := batch5Base(t)
	victim := registerAndLogin(t, base)
	attacker := registerAndLogin(t, base)

	req, err := http.NewRequest(http.MethodGet, base+"/api/v1/mentorship/requests", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+attacker.token)
	req.Header.Set("X-User-ID", victim.id)
	resp, err := httpClient().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	raw, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("mentorship requests: got %d. Body: %s", resp.StatusCode, truncateBody(string(raw)))
	}
	if strings.Contains(string(raw), victim.id) {
		t.Errorf("X-User-ID selected another account's data: %s", truncateBody(string(raw)))
	}
}

// TestRecruiterEvaluationIsScopedAndNotInvented covers 10C. This endpoint used
// to answer with one hard-coded candidate, score and hire recommendation for
// every application on the platform, with no ownership check at all.
func TestRecruiterEvaluationIsScopedAndNotInvented(t *testing.T) {
	base := batch5Base(t)
	recruiter := becomeRecruiter(t, base, registerAndLogin(t, base))
	other := becomeRecruiter(t, base, registerAndLogin(t, base))

	// A syntactically valid id that is not an application belonging to anyone.
	jobID := publishJobForApplications(t, base, recruiter.token, "Batch5 Evaluation Probe")
	path := "/api/v1/recruiter/applications/" + jobID + "/ai-eval"

	status, body := getJSON(t, base, path, recruiter.token)
	if status != http.StatusNotFound {
		t.Errorf("evaluation for an application that does not exist: got %d, want 404. Body: %s", status, truncateBody(body))
	}
	if strings.Contains(body, "Sarah Chen") {
		t.Errorf("the invented evaluation is still being served: %s", truncateBody(body))
	}

	status, body = getJSON(t, base, path, other.token)
	if status != http.StatusNotFound {
		t.Errorf("evaluation as a foreign recruiter: got %d, want 404. Body: %s", status, truncateBody(body))
	}
}

// TestEmployerPortalResolvesItsOwnCompany covers 10A. Creating a company
// answered 500 - the owner role insert omitted a primary key with no default,
// so the whole transaction rolled back - and every /employer route answered
// "Invalid id", because those routes carry no company id and the handlers
// behind them read one from the path.
func TestEmployerPortalResolvesItsOwnCompany(t *testing.T) {
	base := batch5Base(t)
	owner := registerAndLogin(t, base)
	outsider := registerAndLogin(t, base)

	for _, path := range []string{"/api/v1/employer/dashboard", "/api/v1/employer/company"} {
		status, body := getJSON(t, base, path, owner.token)
		if status != http.StatusNotFound {
			t.Errorf("%s before joining a company: got %d, want 404. Body: %s", path, status, truncateBody(body))
		}
	}

	slug := "batch5-co-" + strings.ToLower(strings.ReplaceAll(owner.id, "-", ""))[:16]
	resp := do(t, http.MethodPost, base+"/api/v1/companies", owner.token, map[string]any{
		"name":     "Batch5 Employer Probe",
		"slug":     slug,
		"handle":   slug,
		"industry": "Technology",
		"size":     "11-50",
		"location": "Remote",
	})
	raw, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		t.Fatalf("create company: got %d, want 201. Body: %s", resp.StatusCode, truncateBody(string(raw)))
	}

	for _, path := range []string{
		"/api/v1/employer/dashboard",
		"/api/v1/employer/company",
		"/api/v1/employer/team",
		"/api/v1/employer/jobs",
		"/api/v1/employer/analytics",
		"/api/v1/employer/settings",
	} {
		status, body := getJSON(t, base, path, owner.token)
		if status != http.StatusOK {
			t.Errorf("%s as the company owner: got %d, want 200. Body: %s", path, status, truncateBody(body))
		}
	}

	// Someone with no company still gets 404 rather than another company's.
	status, body := getJSON(t, base, "/api/v1/employer/dashboard", outsider.token)
	if status != http.StatusNotFound {
		t.Errorf("employer dashboard for an account with no company: got %d, want 404. Body: %s", status, truncateBody(body))
	}
}

// TestFreelanceProposalAcceptanceIsOwnedAndSingleUse covers 10E. Accepting a
// proposal checked nothing: the freelancer who wrote it could accept it
// themselves, and any number of times, each acceptance writing another contract
// for the same work.
func TestFreelanceProposalAcceptanceIsOwnedAndSingleUse(t *testing.T) {
	base := batch5Base(t)
	client := registerAndLogin(t, base)
	freelancer := registerAndLogin(t, base)

	// Submitting a proposal now requires an active Freelancer capability, so
	// the fixture completes onboarding rather than relying on a signed-in
	// account being enough. Posting the project does not: hiring is not
	// freelancing, and the client stays an ordinary professional account.
	onboardFreelancer(t, base, freelancer)

	projectID := createdID(t, do(t, http.MethodPost, base+"/api/v1/freelance/projects", client.token, map[string]any{
		"title":       "Batch5 Lifecycle Probe",
		"description": "Posted by the batch 5 lifecycle checks.",
		"budget":      900.0,
	}), "project")

	proposalID := createdID(t, do(t, http.MethodPost, base+"/api/v1/freelance/projects/"+projectID+"/proposals", freelancer.token, map[string]any{
		"bid_amount":     800.0,
		"estimated_days": 10,
		"cover_letter":   "Submitted by the batch 5 lifecycle checks.",
	}), "proposal")

	accept := "/api/v1/freelance/proposals/" + proposalID + "/accept"

	resp := do(t, http.MethodPost, base+accept, freelancer.token, map[string]any{})
	raw, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("the freelancer accepting their own proposal: got %d, want 403. Body: %s", resp.StatusCode, truncateBody(string(raw)))
	}

	resp = do(t, http.MethodPost, base+accept, client.token, map[string]any{})
	raw, _ = io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		t.Fatalf("the client accepting: got %d, want 201. Body: %s", resp.StatusCode, truncateBody(string(raw)))
	}

	resp = do(t, http.MethodPost, base+accept, client.token, map[string]any{})
	raw, _ = io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusConflict {
		t.Errorf("accepting a second time: got %d, want 409. Body: %s", resp.StatusCode, truncateBody(string(raw)))
	}
}

// TestMobileDeviceAndPushBoundaries covers 10H. Device registration answered
// 500 on every call - it conflicted on a column with no matching constraint -
// so no device was ever recorded, and the push endpoint honoured a user_id from
// the body, so any account could push to any other.
func TestMobileDeviceAndPushBoundaries(t *testing.T) {
	base := batch5Base(t)
	owner := registerAndLogin(t, base)
	other := registerAndLogin(t, base)

	device := map[string]any{
		"device_id":    "batch5-" + owner.id,
		"platform":     "ios",
		"device_model": "iPhone",
		"os_version":   "18.0",
		"app_version":  "1.0.0",
	}
	for attempt := 1; attempt <= 2; attempt++ {
		resp := do(t, http.MethodPost, base+"/api/v1/mobile/devices/register", owner.token, device)
		raw, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
			t.Fatalf("registering a device (attempt %d): got %d, want 201. Body: %s", attempt, resp.StatusCode, truncateBody(string(raw)))
		}
	}

	resp := do(t, http.MethodPost, base+"/api/v1/mobile/push/send", owner.token, map[string]any{
		"user_id": other.id,
		"title":   "Batch5",
		"body":    "This must not be deliverable to another account.",
	})
	raw, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("pushing to another account: got %d, want 403. Body: %s", resp.StatusCode, truncateBody(string(raw)))
	}
}

// TestEventAttendeeIsTheSignedInAccount covers the identity a record is written
// under. The attendee name and address came from the request body, so a list
// could be filled with anyone, and an omitted one became "Alex Rivera".
func TestEventAttendeeIsTheSignedInAccount(t *testing.T) {
	base := batch5Base(t)
	host := registerAndLogin(t, base)
	guest := registerAndLogin(t, base)

	eventID := createdID(t, do(t, http.MethodPost, base+"/api/v1/events", host.token, map[string]any{
		"title":       "Batch5 Identity Probe",
		"event_type":  "webinar",
		"description": "Created by the batch 5 identity checks.",
		"start_time":  "2026-12-02T10:00:00Z",
		"end_time":    "2026-12-02T11:00:00Z",
	}), "event")

	resp := do(t, http.MethodPost, base+"/api/v1/events/"+eventID+"/register", guest.token, map[string]any{
		"user_name":  "Someone Else",
		"user_email": "forged@example.invalid",
	})
	raw, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		t.Fatalf("registering for an event: got %d, want 201. Body: %s", resp.StatusCode, truncateBody(string(raw)))
	}
	body := string(raw)
	if strings.Contains(body, "Someone Else") || strings.Contains(body, "forged@example.invalid") {
		t.Errorf("the attendee was recorded under the name the request body claimed: %s", truncateBody(body))
	}
	if strings.Contains(body, "Alex Rivera") {
		t.Errorf("the attendee was recorded under the invented default name: %s", truncateBody(body))
	}
	if !strings.Contains(body, guest.email) {
		t.Errorf("the attendee was not recorded under the signed-in account: %s", truncateBody(body))
	}
}

// createdID pulls the id out of a creation response, which the modules wrap
// under their own key or return bare.
func createdID(t *testing.T, resp *http.Response, key string) string {
	t.Helper()
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		t.Fatalf("create %s: got %d, want 201. Body: %s", key, resp.StatusCode, truncateBody(string(raw)))
	}

	var payload map[string]json.RawMessage
	if err := json.Unmarshal(raw, &payload); err != nil {
		t.Fatalf("create %s: %v. Body: %s", key, err, truncateBody(string(raw)))
	}
	if wrapped, ok := payload[key]; ok {
		var inner map[string]json.RawMessage
		if err := json.Unmarshal(wrapped, &inner); err == nil {
			payload = inner
		}
	}
	var id string
	if err := json.Unmarshal(payload["id"], &id); err != nil || id == "" {
		t.Fatalf("create %s: no id in the response. Body: %s", key, truncateBody(string(raw)))
	}
	return id
}
