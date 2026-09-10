//go:build ciintegration

package ci

import (
	"encoding/json"
	"io"
	"net/http"
	"sync"
	"testing"
)

// Step 9, the load test's finding.
//
// A representative read/write mix at sixteen concurrent clients failed 85 of
// 101 applications with HTTP 500, and the body handed to the applicant was
// `{"error":"ERROR: deadlock detected (SQLSTATE 40P01)"}`. Two things were
// wrong and each is checked here.
//
// The deadlock: CreateApplication took a FOR SHARE lock on the job row and
// then, at the end of the same transaction, ran UPDATE jobs SET
// applications_count = applications_count + 1 on that row. Two applications to
// one posting each held the shared lock and each waited for the other to drop
// it before the update could proceed. PostgreSQL broke the cycle; the applicant
// got a 500. Throughput on the whole mix collapsed to 28 requests a second.
//
// The leak: the handler answered with err.Error(), so a database internal
// reached the browser.

// TestConcurrentApplicationsToOneJobDoNotDeadlock is the fix for the first.
//
// Several candidates apply to the same posting at the same moment, which is
// exactly what a job that has just been shared does. Every one must be
// accepted; none may fail.
func TestConcurrentApplicationsToOneJobDoNotDeadlock(t *testing.T) {
	base := required(t, "TEST_API_URL")

	employer := becomeRecruiter(t, base, registerAndLogin(t, base))
	jobID := publishJobForApplications(t, base, employer.token, "Concurrent application probe")

	const applicants = 8
	candidates := make([]ciUser, applicants)
	for i := range candidates {
		candidates[i] = registerAndLogin(t, base)
	}

	statuses := make([]int, applicants)
	bodies := make([]string, applicants)

	var start sync.WaitGroup
	start.Add(1)
	var done sync.WaitGroup
	for i := range candidates {
		done.Add(1)
		go func(i int) {
			defer done.Done()
			start.Wait() // release all of them together
			resp := do(t, http.MethodPost, base+"/api/v1/jobs/"+jobID+"/apply", candidates[i].token,
				map[string]any{"coverLetter": "Submitted during the concurrency probe."})
			defer resp.Body.Close()
			raw, _ := io.ReadAll(resp.Body)
			statuses[i] = resp.StatusCode
			bodies[i] = string(raw)
		}(i)
	}
	start.Done()
	done.Wait()

	for i, status := range statuses {
		if status != http.StatusCreated {
			t.Errorf("applicant %d: got %d, want 201. Body: %s", i, status, truncateBody(bodies[i]))
		}
	}
}

// TestRepeatedApplicationsFromOneCandidateAnswerConflict is the fix for the
// second, and for the duplicate race the unique index was already catching but
// nothing was translating.
//
// One candidate, several simultaneous submissions: exactly one is accepted, the
// rest are told they have already applied, and no answer carries a database
// error.
func TestRepeatedApplicationsFromOneCandidateAnswerConflict(t *testing.T) {
	base := required(t, "TEST_API_URL")

	employer := becomeRecruiter(t, base, registerAndLogin(t, base))
	jobID := publishJobForApplications(t, base, employer.token, "Duplicate application probe")
	candidate := registerAndLogin(t, base)

	const attempts = 5
	statuses := make([]int, attempts)
	bodies := make([]string, attempts)

	var start sync.WaitGroup
	start.Add(1)
	var done sync.WaitGroup
	for i := 0; i < attempts; i++ {
		done.Add(1)
		go func(i int) {
			defer done.Done()
			start.Wait()
			resp := do(t, http.MethodPost, base+"/api/v1/jobs/"+jobID+"/apply", candidate.token,
				map[string]any{"coverLetter": "Submitted twice by an impatient applicant."})
			defer resp.Body.Close()
			raw, _ := io.ReadAll(resp.Body)
			statuses[i] = resp.StatusCode
			bodies[i] = string(raw)
		}(i)
	}
	start.Done()
	done.Wait()

	created, conflicts := 0, 0
	for i, status := range statuses {
		switch status {
		case http.StatusCreated:
			created++
		case http.StatusConflict:
			conflicts++
		default:
			t.Errorf("attempt %d: got %d, want 201 or 409. Body: %s", i, status, truncateBody(bodies[i]))
		}

		// Whatever the answer, it must not carry the database's own words. A
		// SQLSTATE or a constraint name in a response body tells an attacker
		// about the schema and tells the applicant nothing.
		for _, leak := range []string{"SQLSTATE", "pq:", "pgx", "constraint", "idx_job_applications"} {
			if containsFold(bodies[i], leak) {
				t.Errorf("attempt %d leaked a database internal (%q): %s", i, leak, truncateBody(bodies[i]))
			}
		}
	}

	if created != 1 {
		t.Errorf("got %d accepted applications from one candidate, want exactly 1", created)
	}
	if conflicts != attempts-1 {
		t.Errorf("got %d conflicts, want %d", conflicts, attempts-1)
	}
}

func publishJobForApplications(t *testing.T, base, token, title string) string {
	t.Helper()
	resp := do(t, http.MethodPost, base+"/api/v1/recruiter/jobs", token, map[string]any{
		"title":          title,
		"description":    "Published by the application concurrency tests.",
		"status":         "Active",
		"workplaceType":  "Remote",
		"employmentType": "Full-time",
		"location":       "Remote",
	})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		raw, _ := io.ReadAll(resp.Body)
		t.Fatalf("publish job: got %d, want 201. Body: %s", resp.StatusCode, truncateBody(string(raw)))
	}
	var created struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&created); err != nil || created.ID == "" {
		t.Fatalf("publish job: no id in response (%v)", err)
	}
	return created.ID
}

func truncateBody(s string) string {
	if len(s) > 300 {
		return s[:300] + "..."
	}
	return s
}

func containsFold(haystack, needle string) bool {
	return len(needle) > 0 && len(haystack) >= len(needle) &&
		indexFold(haystack, needle) >= 0
}

func indexFold(haystack, needle string) int {
	lower := func(b byte) byte {
		if b >= 'A' && b <= 'Z' {
			return b + ('a' - 'A')
		}
		return b
	}
	for i := 0; i+len(needle) <= len(haystack); i++ {
		match := true
		for j := 0; j < len(needle); j++ {
			if lower(haystack[i+j]) != lower(needle[j]) {
				match = false
				break
			}
		}
		if match {
			return i
		}
	}
	return -1
}
