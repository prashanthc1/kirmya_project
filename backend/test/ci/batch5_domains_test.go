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
		"/api/v1/recruiter/jobs",
		"/api/v1/referrals/my-referrals", "/api/v1/referrals/requests",
		"/api/v1/resume-analysis/history",
		"/api/v1/safety/blocks", "/api/v1/safety/mutes", "/api/v1/safety/reports", "/api/v1/safety/restrictions",
		"/api/v1/settings/data-export/history", "/api/v1/settings/notifications",
		"/api/v1/verifications/requests",
	}

	for _, path := range paths {
		status, body := getJSON(t, base, path, user.token)
		if status != http.StatusOK {
			t.Errorf("%s: got %d, want 200. Body: %s", path, status, truncateBody(body))
			continue
		}
		for _, field := range nullListFields(body) {
			t.Errorf("%s: %s is null; a list endpoint must answer with an array", path, field)
		}
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
	owner := registerAndLogin(t, base)
	intruder := registerAndLogin(t, base)

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
	recruiter := registerAndLogin(t, base)
	other := registerAndLogin(t, base)

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
